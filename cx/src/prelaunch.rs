use owo_colors::OwoColorize;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

const CHECK_INTERVAL_SECS: u64 = 4 * 60 * 60; // 4 hours

/// Run all automatic pre-launch actions: heal, doctor, profile detection.
/// Returns extra args to prepend to the codex launch (e.g. --cd for auto-profile).
pub fn run(codex_home: &Path) -> Vec<String> {
    auto_heal();
    auto_doctor(codex_home);
    auto_profile()
}

/// Silently kill orphaned codex exec processes.
fn auto_heal() {
    let mut sys = sysinfo::System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let orphans = crate::heal::scan_orphans(&sys);
    if orphans.is_empty() {
        return;
    }

    let mut killed = 0u32;
    for (pid, _, _) in &orphans {
        if let Some(proc_) = sys.process(*pid) {
            proc_.kill();
            killed += 1;
        }
    }

    if killed > 0 {
        eprintln!(
            "{} cleaned up {killed} orphaned process(es)",
            "[cx]".dimmed()
        );
    }
}

/// Run quick health checks if enough time has passed since the last check.
/// Prints one-line warnings for failures, never blocks.
fn auto_doctor(codex_home: &Path) {
    let state_dir = codex_home.join("state");
    let stamp_file = state_dir.join("last-doctor");

    if !should_run_check(&stamp_file) {
        return;
    }

    let mut warnings: Vec<String> = Vec::new();

    if which::which("codex").is_err() {
        warnings.push("codex not found on PATH".into());
    }

    if which::which("pass-cli").is_err() {
        warnings.push("pass-cli not found on PATH".into());
    } else if !crate::heal::cmd_succeeds("pass-cli", &["test"]) {
        warnings.push("pass-cli auth expired — run 'pass-cli login'".into());
    }

    if which::which("gh").is_ok() && !crate::heal::cmd_succeeds("gh", &["auth", "status"]) {
        warnings.push("gh not authenticated — run 'gh auth login'".into());
    }

    if which::which("node").is_err() {
        warnings.push("node not found (MCP servers need node/npx)".into());
    }

    for w in &warnings {
        eprintln!("{} {}", "[cx]".yellow().bold(), w);
    }

    // Write timestamp even if there are warnings (don't nag every launch)
    let _ = std::fs::create_dir_all(&state_dir);
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let _ = std::fs::write(&stamp_file, now.to_string());
}

/// Detect if cwd is under D:\Projects and return --cd args for auto-scoping.
fn auto_profile() -> Vec<String> {
    let Ok(cwd) = std::env::current_dir() else {
        return vec![];
    };

    let projects_dir = Path::new(crate::PROJECTS_DIR);
    let Ok(rel) = cwd.strip_prefix(projects_dir) else {
        return vec![];
    };

    let Some(project_name) = rel.components().next() else {
        return vec![];
    };

    let project_root = projects_dir.join(project_name);
    if !project_root.is_dir() {
        return vec![];
    }

    eprintln!(
        "{} detected project: {}",
        "[cx]".dimmed(),
        project_root.display()
    );
    vec!["--cd".into(), project_root.to_string_lossy().into_owned()]
}

fn should_run_check(stamp_file: &Path) -> bool {
    let Ok(contents) = std::fs::read_to_string(stamp_file) else {
        return true;
    };
    let Ok(last) = contents.trim().parse::<u64>() else {
        return true;
    };
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    now.saturating_sub(last) >= CHECK_INTERVAL_SECS
}

#[cfg(test)]
mod tests {
    use super::*;

    fn codex_home() -> std::path::PathBuf {
        dirs::home_dir().unwrap().join(".codex")
    }

    #[test]
    fn missing_stamp_triggers_check() {
        // A path that will never exist — same as fresh install
        assert!(should_run_check(Path::new("Z:\\nonexistent\\stamp")));
    }

    #[test]
    fn real_state_dir_stamp_behavior() {
        // Write a real stamp to the actual state dir, then verify timing logic
        let state_dir = codex_home().join("state");
        let _ = std::fs::create_dir_all(&state_dir);
        let stamp = state_dir.join("last-doctor-test");

        // Fresh stamp (now) → should NOT trigger
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        std::fs::write(&stamp, now.to_string()).unwrap();
        assert!(!should_run_check(&stamp));

        // Old stamp (5h ago) → should trigger (threshold is 4h)
        let old = now - (5 * 60 * 60);
        std::fs::write(&stamp, old.to_string()).unwrap();
        assert!(should_run_check(&stamp));

        // Corrupt stamp → should trigger
        std::fs::write(&stamp, "not-a-number").unwrap();
        assert!(should_run_check(&stamp));

        // Cleanup
        let _ = std::fs::remove_file(&stamp);
    }

    #[test]
    fn projects_dir_exists() {
        assert!(Path::new(crate::PROJECTS_DIR).is_dir());
    }

    #[test]
    fn scripts_dir_has_ps1_files() {
        let scripts = codex_home().join("scripts");
        assert!(
            scripts.is_dir(),
            "scripts dir must exist at {}",
            scripts.display()
        );
        let count = std::fs::read_dir(&scripts)
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().extension().is_some_and(|ext| ext == "ps1"))
            .count();
        assert!(count > 0, "scripts dir should have .ps1 files, got {count}");
    }
}
