mod cli;
mod doctor;
mod env;
mod heal;
mod launch;
mod prelaunch;
mod script;

use anyhow::Result;
use cli::{Command, PROFILE_NAMES, ROUTE_ALIASES, SCRIPT_COMMANDS};
use owo_colors::OwoColorize;
use std::path::{Path, PathBuf};

const DEFAULT_CODEX_ARGS: [&str; 2] = ["--search", "--no-alt-screen"];
pub(crate) const PROJECTS_DIR: &str = "D:\\Projects";

fn main() -> Result<()> {
    let cli = cli::Cli::parse_from_env();
    let home = &cli.codex_home;
    let tmpl = &cli.env_template;

    match cli.command {
        // No subcommand: check if codex_args starts with a known command,
        // otherwise auto-heal, auto-doctor, auto-profile, then launch
        None => {
            if let Some(sub) = cli.codex_args.first() {
                let s = sub.as_str();
                let is_known = PROFILE_NAMES.contains(&s)
                    || ROUTE_ALIASES.contains(&s)
                    || SCRIPT_COMMANDS
                        .iter()
                        .any(|(_, aliases)| aliases.contains(&s));
                if is_known {
                    return route_external(home, tmpl, &cli.codex_args);
                }
            }
            let mut args = prelaunch::run(home);
            args.extend(DEFAULT_CODEX_ARGS.map(String::from));
            args.extend(cli.codex_args);
            launch::run(home, tmpl, args)
        }
        Some(Command::Doctor) => doctor::run(home, tmpl),
        Some(Command::Heal { kill }) => heal::run(kill),
        Some(Command::Find { keyword }) => cmd_find(&keyword),
        Some(Command::Work { target, args }) => {
            let path = resolve_project_path(&target)?;
            launch_with_prefix(home, tmpl, &["--cd", &path.to_string_lossy()], args)
        }
        Some(Command::Do { run, message }) => {
            let msg = message.join(" ");
            if msg.is_empty() {
                anyhow::bail!("cx do: missing message (use: cx do -- \"...\")");
            }
            cmd_do(home, &msg, run)
        }
        Some(Command::Mcp { args }) => {
            let codex =
                which::which("codex").map_err(|_| anyhow::anyhow!("codex not found on PATH"))?;
            let status = std::process::Command::new(codex)
                .arg("mcp")
                .args(&args)
                .status()?;
            std::process::exit(status.code().unwrap_or(1));
        }
        Some(Command::Open { target }) => cmd_open(&target),
        Some(Command::External(args)) => route_external(home, tmpl, &args),
    }
}

/// Route unrecognized subcommands through profiles, scripts, then codex passthrough.
fn route_external(home: &Path, tmpl: &Path, args: &[String]) -> Result<()> {
    let sub = args[0].as_str();
    let rest: Vec<String> = args[1..].to_vec();

    // Profile shortcuts (cf, docs, code)
    if PROFILE_NAMES.contains(&sub) {
        return launch_with_prefix(home, tmpl, &["--profile", sub], rest);
    }

    // Route/classify → codex-route script
    if ROUTE_ALIASES.contains(&sub) {
        let script_args = strip_leading_separator(&rest);
        if script_args.is_empty() {
            anyhow::bail!("cx route: missing message");
        }
        return script::run(home, "codex-route", script_args);
    }

    // Script-delegated commands
    for (script_name, aliases) in SCRIPT_COMMANDS {
        if aliases.contains(&sub) {
            return script::run(home, &format!("cx-{script_name}"), rest);
        }
    }

    // Unknown → codex passthrough
    let mut passthrough = Vec::from(DEFAULT_CODEX_ARGS.map(String::from));
    passthrough.extend(args.iter().cloned());
    launch::run(home, tmpl, passthrough)
}

/// Launch codex with prefix flags + `--search --no-alt-screen` + extra args.
fn launch_with_prefix(home: &Path, tmpl: &Path, prefix: &[&str], extra: Vec<String>) -> Result<()> {
    let mut args: Vec<String> = prefix.iter().map(|s| s.to_string()).collect();
    args.extend(DEFAULT_CODEX_ARGS.map(String::from));
    args.extend(extra);
    launch::run(home, tmpl, args)
}

fn resolve_project_path(target: &str) -> Result<PathBuf> {
    let p = Path::new(target);
    if p.is_dir() {
        return Ok(p.to_path_buf());
    }
    let candidate = Path::new(PROJECTS_DIR).join(target);
    if candidate.is_dir() {
        return Ok(candidate);
    }
    anyhow::bail!("could not resolve repo/path: {target}");
}

fn cmd_find(keyword: &str) -> Result<()> {
    let projects = Path::new(PROJECTS_DIR);
    if !projects.is_dir() {
        anyhow::bail!("{PROJECTS_DIR} not found");
    }
    let kw = keyword.to_lowercase();
    let mut entries: Vec<_> = std::fs::read_dir(projects)?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
        .filter(|e| {
            let name = e.file_name().to_string_lossy().to_lowercase();
            name != ".archive" && name.contains(&kw)
        })
        .collect();
    entries.sort_by_key(|e| e.file_name());
    if entries.is_empty() {
        println!("{}", "no matching projects found".dimmed());
    } else {
        for e in entries {
            println!("{}", e.path().display());
        }
    }
    Ok(())
}

fn cmd_open(target: &str) -> Result<()> {
    let path = resolve_project_path(target)?;
    println!("opening {}", path.display().bold());
    open::that(&path).map_err(|e| anyhow::anyhow!("failed to open {}: {e}", path.display()))
}

fn cmd_do(codex_home: &Path, message: &str, auto_run: bool) -> Result<()> {
    let route_script = codex_home.join("scripts").join("codex-route.ps1");
    if !route_script.is_file() {
        anyhow::bail!("missing router script: {}", route_script.display());
    }

    let output = std::process::Command::new("pwsh")
        .args(["-NoProfile", "-NonInteractive", "-File"])
        .arg(&route_script)
        .arg("--")
        .arg(message)
        .output()?;
    if !output.status.success() {
        anyhow::bail!("router failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    let json_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
    println!("{json_str}");

    if !auto_run {
        return Ok(());
    }

    let val: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| anyhow::anyhow!("failed to parse router JSON: {e}"))?;

    if val["needs_confirmation"].as_bool() == Some(true) {
        anyhow::bail!("refusing to auto-run: needs_confirmation=true");
    }

    let empty = vec![];
    let cmds = val
        .pointer("/handoff/recommended_commands")
        .and_then(|v| v.as_array())
        .unwrap_or(&empty);

    if cmds.is_empty() {
        println!("{}", "cx do --run: no recommended_commands to run".dimmed());
        return Ok(());
    }

    let cx_exe = std::env::current_exe()?;
    for cmd in cmds {
        let Some(cmd_str) = cmd.as_str() else {
            continue;
        };
        let Some(rest) = cmd_str.strip_prefix("cx ") else {
            continue;
        };
        let parts: Vec<&str> = rest.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }
        println!("{} {cmd_str}", "[RUN]".cyan().bold());
        let status = std::process::Command::new(&cx_exe).args(&parts).status()?;
        if !status.success() {
            eprintln!("{} command exited with {status}", "[WARN]".yellow().bold());
        }
    }
    Ok(())
}

fn strip_leading_separator(args: &[String]) -> Vec<String> {
    if args.first().map(|s| s.as_str()) == Some("--") {
        args[1..].to_vec()
    } else {
        args.to_vec()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strip_with_separator() {
        let args: Vec<String> = vec!["--".into(), "hello".into(), "world".into()];
        assert_eq!(strip_leading_separator(&args), vec!["hello", "world"]);
    }

    #[test]
    fn strip_without_separator() {
        let args: Vec<String> = vec!["hello".into(), "world".into()];
        assert_eq!(strip_leading_separator(&args), vec!["hello", "world"]);
    }

    #[test]
    fn strip_empty() {
        let args: Vec<String> = vec![];
        assert!(strip_leading_separator(&args).is_empty());
    }

    #[test]
    fn strip_only_separator() {
        let args: Vec<String> = vec!["--".into()];
        assert!(strip_leading_separator(&args).is_empty());
    }

    #[test]
    fn resolve_existing_project() {
        let path = resolve_project_path("cx").unwrap();
        assert!(path.is_dir());
    }

    #[test]
    fn resolve_nonexistent_fails() {
        assert!(resolve_project_path("nonexistent-repo-xyz-99").is_err());
    }
}
