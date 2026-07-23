use anyhow::{Context, Result};
use owo_colors::OwoColorize;
use std::path::Path;
use std::process::Command;

/// Run a command and exit with its exit code.
fn exec_and_exit(cmd: &mut Command) -> Result<()> {
    let status = cmd.status()?;
    std::process::exit(status.code().unwrap_or(1));
}

/// Launch codex with secrets injected.
///
/// Strategy (from research on doppler/op/chamber patterns):
///   1. If the env template has no pass:// refs, load it directly (zero overhead).
///   2. If pass-cli is available, use `pass-cli run --env-file` to inject secrets
///      and exec codex in a single step (the tool handles resolution natively).
///   3. If pass-cli is unavailable or fails, fall back to dev.local.env.
///   4. No retries on every launch — fail fast, fall back immediately.
pub fn run(codex_home: &Path, env_template: &Path, args: Vec<String>) -> Result<()> {
    let codex = which::which("codex").context("codex not found on PATH")?;
    let local_fallback = codex_home.join("env").join("dev.local.env");

    // Fast path: no secrets to resolve
    if !env_template.is_file() || crate::env::pass_ref_count(env_template) == 0 {
        if env_template.is_file() {
            crate::env::import_env_file(env_template)?;
        }
        exec_and_exit(Command::new(&codex).args(&args))?;
    }

    // Try pass-cli run --env-file (single command, no manual parsing)
    if which::which("pass-cli").is_ok() {
        if crate::heal::cmd_succeeds("pass-cli", &["test"]) {
            exec_and_exit(
                Command::new("pass-cli")
                    .arg("run")
                    .arg("--env-file")
                    .arg(env_template)
                    .arg("--no-masking")
                    .arg("--")
                    .arg(&codex)
                    .args(&args),
            )
            .context("failed to execute pass-cli run")?;
        }

        eprintln!(
            "{} pass-cli connectivity check failed, trying fallback...",
            "[cx]".yellow().bold()
        );
    } else {
        eprintln!(
            "{} pass-cli not found on PATH, trying fallback...",
            "[cx]".yellow().bold()
        );
    }

    // Fallback: dev.local.env
    if local_fallback.is_file() {
        eprintln!(
            "{} using local fallback: {}",
            "[cx]".yellow().bold(),
            local_fallback.display()
        );
        crate::env::import_env_file(&local_fallback)?;
        exec_and_exit(Command::new(&codex).args(&args))?;
    }

    anyhow::bail!(
        "pass-cli unavailable and no local fallback at {}.\n\
         Run 'pass-cli login' and 'pass-cli test', or create the fallback file.",
        local_fallback.display()
    );
}
