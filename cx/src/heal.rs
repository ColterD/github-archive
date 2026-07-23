use anyhow::Result;
use owo_colors::OwoColorize;
use sysinfo::{Pid, System};

const ORPHAN_PROCESS_NAMES: &[&str] = &["codex.exe", "node.exe", "pwsh.exe", "powershell.exe"];

/// Run a command silently and return whether it exited successfully.
pub(crate) fn cmd_succeeds(exe: &str, args: &[&str]) -> bool {
    std::process::Command::new(exe)
        .args(args)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

/// Scan for orphaned codex exec processes. Returns (pid, process_name, cmdline).
pub(crate) fn scan_orphans(sys: &System) -> Vec<(Pid, String, String)> {
    sys.processes()
        .iter()
        .filter_map(|(pid, proc_)| {
            let name = proc_.name().to_string_lossy().to_lowercase();
            if !ORPHAN_PROCESS_NAMES.iter().any(|t| name == *t) {
                return None;
            }
            let cmdline = proc_
                .cmd()
                .join(std::ffi::OsStr::new(" "))
                .to_string_lossy()
                .to_string();
            let cl = cmdline.to_lowercase();
            let is_orphan = (cl.contains("codex") && cl.contains("exec"))
                || (cl.contains("codex-dev.ps1") && cl.contains("exec"));
            is_orphan.then_some((*pid, name, cmdline))
        })
        .collect()
}

pub fn run(kill: bool) -> Result<()> {
    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let matched = scan_orphans(&sys);

    println!("{}", "cx heal".bold());
    println!(
        "  found {} running codex exec-related process(es)",
        matched.len().bold()
    );

    if matched.is_empty() {
        return Ok(());
    }

    for (pid, name, cmd) in &matched {
        let truncated = cmd.get(..120).unwrap_or(cmd);
        println!("  {} {name}: {}", format!("[{pid}]").dimmed(), truncated);
    }

    if kill {
        println!();
        for (pid, name, _) in &matched {
            if let Some(proc_) = sys.process(*pid) {
                proc_.kill();
                println!("  {} [{pid}] {name}", "killed".red().bold());
            }
        }
    } else {
        println!(
            "\n  {}",
            "use 'cx heal --kill' to terminate these processes".dimmed()
        );
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn succeeds_with_true_command() {
        assert!(cmd_succeeds("cmd", &["/c", "exit", "0"]));
    }

    #[test]
    fn fails_with_false_command() {
        assert!(!cmd_succeeds("cmd", &["/c", "exit", "1"]));
    }

    #[test]
    fn fails_with_nonexistent_binary() {
        assert!(!cmd_succeeds("nonexistent-binary-xyz-99", &[]));
    }

    #[test]
    fn scan_orphans_returns_vec() {
        let mut sys = System::new();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
        // Just verify it doesn't panic and returns a Vec
        let _ = scan_orphans(&sys);
    }
}
