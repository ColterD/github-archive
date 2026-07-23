use anyhow::Result;
use std::path::Path;
use std::process::Command;

/// Run a PowerShell script from ~/.codex/scripts/{name}.ps1
pub fn run(codex_home: &Path, name: &str, args: Vec<String>) -> Result<()> {
    let script = codex_home.join("scripts").join(format!("{name}.ps1"));
    if !script.is_file() {
        anyhow::bail!("missing script: {}", script.display());
    }

    let status = Command::new("pwsh")
        .args(["-NoProfile", "-File"])
        .arg(&script)
        .args(&args)
        .status()?;

    std::process::exit(status.code().unwrap_or(1));
}
