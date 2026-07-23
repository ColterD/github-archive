use anyhow::Result;
use owo_colors::OwoColorize;
use std::path::Path;
use std::process::Command;

struct Check {
    name: &'static str,
    passed: bool,
    detail: String,
}

impl Check {
    fn ok(name: &'static str, detail: impl Into<String>) -> Self {
        Self {
            name,
            passed: true,
            detail: detail.into(),
        }
    }
    fn fail(name: &'static str, detail: impl Into<String>) -> Self {
        Self {
            name,
            passed: false,
            detail: detail.into(),
        }
    }
}

fn cmd_version(exe: &Path, args: &[&str]) -> String {
    Command::new(exe)
        .args(args)
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|| "unknown".into())
}

pub fn run(codex_home: &Path, env_template: &Path) -> Result<()> {
    println!("{}\n", "cx doctor".bold());

    let home = dirs::home_dir().unwrap_or_default();
    println!("  {}  {}", "home:".dimmed(), home.display());
    println!("  {}  {}", "codex_home:".dimmed(), codex_home.display());
    println!("  {}  {}", "env_template:".dimmed(), env_template.display());
    println!();

    let mut checks = Vec::new();

    // codex
    checks.push(match which::which("codex") {
        Ok(p) => Check::ok("codex", format!("found: {}", p.display())),
        Err(_) => Check::fail("codex", "not found on PATH"),
    });

    // pass-cli
    let pass_cli_path = which::which("pass-cli").ok();
    checks.push(match &pass_cli_path {
        Some(p) => {
            let ver = cmd_version(p, &["--version"]);
            Check::ok("pass-cli", format!("{} ({ver})", p.display()))
        }
        None => Check::fail("pass-cli", "not found on PATH"),
    });

    // pass-cli connectivity (only if pass-cli exists)
    let pass_test_ok = pass_cli_path.is_some() && crate::heal::cmd_succeeds("pass-cli", &["test"]);
    if pass_cli_path.is_some() {
        checks.push(if pass_test_ok {
            Check::ok("pass-cli test", "connection OK")
        } else {
            Check::fail("pass-cli test", "connection failed — run 'pass-cli login'")
        });
    }

    // env template
    if env_template.is_file() {
        let refs = crate::env::pass_ref_count(env_template);
        checks.push(Check::ok("env template", format!("{refs} pass:// ref(s)")));
    } else {
        checks.push(Check::fail(
            "env template",
            format!("not found: {}", env_template.display()),
        ));
    }

    // local fallback
    let fallback = codex_home.join("env").join("dev.local.env");
    checks.push(if fallback.is_file() {
        Check::ok("local fallback", format!("exists: {}", fallback.display()))
    } else {
        Check::ok(
            "local fallback",
            format!("not present (optional): {}", fallback.display()),
        )
    });

    // secret injection (only if pass-cli test passed + template exists)
    if pass_test_ok && env_template.is_file() {
        match Command::new("pass-cli")
            .args(["inject", "-i"])
            .arg(env_template)
            .arg("-f")
            .output()
        {
            Ok(out) if out.status.success() => {
                let text = String::from_utf8_lossy(&out.stdout);
                let key_count = text
                    .lines()
                    .filter(|l| {
                        let t = l.trim();
                        !t.is_empty() && !t.starts_with('#') && t.contains('=')
                    })
                    .count();
                checks.push(Check::ok(
                    "secret injection",
                    format!("{key_count} key(s) resolved"),
                ));
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
                checks.push(Check::fail(
                    "secret injection",
                    format!("exit {}: {stderr}", out.status),
                ));
            }
            Err(e) => checks.push(Check::fail("secret injection", format!("failed: {e}"))),
        }
    }

    // gh auth
    checks.push(match which::which("gh") {
        Ok(_) if crate::heal::cmd_succeeds("gh", &["auth", "status"]) => {
            Check::ok("gh auth", "authenticated")
        }
        Ok(_) => Check::fail("gh auth", "not authenticated — run 'gh auth login'"),
        Err(_) => Check::fail("gh", "not found on PATH"),
    });

    // node
    checks.push(match which::which("node") {
        Ok(p) => Check::ok("node", format!("{}", p.display())),
        Err(_) => Check::fail("node", "not found (some MCP servers need node/npx)"),
    });

    // pwsh
    checks.push(match which::which("pwsh") {
        Ok(p) => {
            let ver = cmd_version(
                &p,
                &[
                    "-NoProfile",
                    "-Command",
                    "$PSVersionTable.PSVersion.ToString()",
                ],
            );
            Check::ok("pwsh", format!("v{ver} ({})", p.display()))
        }
        Err(_) => Check::fail("pwsh", "not found (needed for script subcommands)"),
    });

    // scripts directory
    let scripts_dir = codex_home.join("scripts");
    if scripts_dir.is_dir() {
        let count = std::fs::read_dir(&scripts_dir)
            .map(|rd| {
                rd.filter_map(|e| e.ok())
                    .filter(|e| e.path().extension().and_then(|x| x.to_str()) == Some("ps1"))
                    .count()
            })
            .unwrap_or(0);
        checks.push(Check::ok("scripts dir", format!("{count} .ps1 script(s)")));
    } else {
        checks.push(Check::fail(
            "scripts dir",
            format!("not found: {}", scripts_dir.display()),
        ));
    }

    // Print results
    println!("  {}:", "checks".bold());
    for c in &checks {
        let icon = if c.passed {
            " OK ".on_green().white().bold().to_string()
        } else {
            "FAIL".on_red().white().bold().to_string()
        };
        println!("   [{icon}] {}: {}", c.name.bold(), c.detail);
    }

    let failures = checks.iter().filter(|c| !c.passed).count();

    println!();
    if failures > 0 {
        println!(
            "  {} cx doctor completed with {} failure(s).",
            "✗".red().bold(),
            failures
        );
        std::process::exit(2);
    } else {
        println!("  {} cx doctor completed successfully.", "✓".green().bold());
    }
    Ok(())
}
