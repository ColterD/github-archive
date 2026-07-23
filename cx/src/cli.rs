use clap::{Parser, Subcommand, ValueHint};
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "cx",
    about = "Codex launcher with Proton Pass secret injection",
    version,
    args_conflicts_with_subcommands = true,
    after_help = "\
SCRIPT COMMANDS (delegated to ~/.codex/scripts/):
  smoke, routing-tests, mcp-doctor, gh-doctor, pr, ci, review,
  projects, cf-check, cf-audit, cf-tunnel-audit, cf-www, cf-fix

PROFILE SHORTCUTS:
  cf, docs, code               Launch Codex with a task-specific profile

ROUTING:
  route|classify -- \"msg\"      Classify a message via the router"
)]
pub struct Cli {
    /// Extra args passed directly to codex when no subcommand is given
    #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
    pub codex_args: Vec<String>,

    #[command(subcommand)]
    pub command: Option<Command>,

    #[arg(skip)]
    pub codex_home: PathBuf,
    #[arg(skip)]
    pub env_template: PathBuf,
}

impl Cli {
    pub fn parse_from_env() -> Self {
        let home = dirs::home_dir().expect("could not determine home directory");
        let codex_home = std::env::var("CODEX_HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|_| home.join(".codex"));
        let env_template = codex_home.join("env").join("dev.env");

        let mut cli = Self::parse();
        cli.codex_home = codex_home;
        cli.env_template = env_template;
        cli
    }
}

#[derive(Subcommand)]
pub enum Command {
    /// Environment, auth, and MCP sanity checks
    Doctor,

    /// List (or kill) stuck codex exec processes
    #[command(visible_alias = "self-heal", visible_alias = "selfheal")]
    Heal {
        /// Terminate matched processes instead of just listing them
        #[arg(long)]
        kill: bool,
    },

    /// Find repos under D:\Projects by name
    #[command(visible_alias = "search-projects")]
    Find {
        #[arg(value_hint = ValueHint::Other)]
        keyword: String,
    },

    /// Launch Codex rooted at D:\Projects/<repo>
    #[command(visible_alias = "repo")]
    Work {
        #[arg(value_hint = ValueHint::DirPath)]
        target: String,
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },

    /// Route + print (or auto-run) suggested commands
    #[command(visible_alias = "next", visible_alias = "handoff")]
    Do {
        /// Auto-run the recommended commands
        #[arg(long)]
        run: bool,
        /// Message to route
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        message: Vec<String>,
    },

    /// Forward to: codex mcp ...
    Mcp {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },

    /// Open a project folder in the system file explorer
    Open {
        #[arg(value_hint = ValueHint::DirPath)]
        target: String,
    },

    /// Unrecognized: scripts, profiles, or codex passthrough
    #[command(external_subcommand)]
    External(Vec<String>),
}

// Script subcommands that delegate to ~/.codex/scripts/cx-{name}.ps1
pub const SCRIPT_COMMANDS: &[(&str, &[&str])] = &[
    ("smoke", &["smoke"]),
    ("routing-tests", &["routing-tests"]),
    ("mcp-doctor", &["mcp-doctor", "mcpdoctor"]),
    ("gh-doctor", &["gh-doctor", "ghdoctor"]),
    ("gh-pr", &["pr"]),
    ("gh-ci", &["ci"]),
    ("gh-review", &["review"]),
    ("projects", &["projects"]),
    ("cf-check", &["cf-check"]),
    ("cf-audit", &["cf-audit"]),
    ("cf-tunnel-audit", &["cf-tunnel-audit"]),
    ("cf-www", &["cf-www"]),
    ("cf-fix", &["cf-fix"]),
];

pub const PROFILE_NAMES: &[&str] = &["cf", "docs", "code"];
pub const ROUTE_ALIASES: &[&str] = &["route", "router", "classify"];

#[cfg(test)]
mod tests {
    use super::*;
    use clap::Parser;

    #[test]
    fn parse_no_args() {
        let cli = Cli::try_parse_from(["cx"]).unwrap();
        assert!(cli.command.is_none());
        assert!(cli.codex_args.is_empty());
    }

    #[test]
    fn parse_doctor() {
        let cli = Cli::try_parse_from(["cx", "doctor"]).unwrap();
        assert!(matches!(cli.command, Some(Command::Doctor)));
    }

    #[test]
    fn parse_heal_default() {
        let cli = Cli::try_parse_from(["cx", "heal"]).unwrap();
        assert!(matches!(cli.command, Some(Command::Heal { kill: false })));
    }

    #[test]
    fn parse_heal_kill() {
        let cli = Cli::try_parse_from(["cx", "heal", "--kill"]).unwrap();
        assert!(matches!(cli.command, Some(Command::Heal { kill: true })));
    }

    #[test]
    fn parse_find() {
        let cli = Cli::try_parse_from(["cx", "find", "myrepo"]).unwrap();
        assert!(matches!(cli.command, Some(Command::Find { keyword }) if keyword == "myrepo"));
    }

    #[test]
    fn parse_work() {
        let cli = Cli::try_parse_from(["cx", "work", "myrepo"]).unwrap();
        assert!(matches!(cli.command, Some(Command::Work { target, .. }) if target == "myrepo"));
    }

    #[test]
    fn parse_open() {
        let cli = Cli::try_parse_from(["cx", "open", "myrepo"]).unwrap();
        assert!(matches!(cli.command, Some(Command::Open { target }) if target == "myrepo"));
    }

    #[test]
    fn parse_trailing_codex_args() {
        let cli = Cli::try_parse_from(["cx", "--", "--full-context"]).unwrap();
        assert!(cli.command.is_none());
        assert_eq!(cli.codex_args, vec!["--full-context"]);
    }

    #[test]
    fn parse_unknown_goes_to_codex_args() {
        // With trailing_var_arg, unrecognized words become codex_args, not External
        let cli = Cli::try_parse_from(["cx", "smoke"]).unwrap();
        assert!(cli.command.is_none());
        assert_eq!(cli.codex_args, vec!["smoke"]);
    }

    #[test]
    fn parse_visible_alias_selfheal() {
        let cli = Cli::try_parse_from(["cx", "selfheal"]).unwrap();
        assert!(matches!(cli.command, Some(Command::Heal { kill: false })));
    }

    #[test]
    fn parse_visible_alias_repo() {
        let cli = Cli::try_parse_from(["cx", "repo", "myrepo"]).unwrap();
        assert!(matches!(cli.command, Some(Command::Work { target, .. }) if target == "myrepo"));
    }
}
