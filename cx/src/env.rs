use std::path::Path;

/// Count `pass://` references in the env template.
pub fn pass_ref_count(template: &Path) -> usize {
    std::fs::read_to_string(template)
        .map(|c| c.matches("pass://").count())
        .unwrap_or(0)
}

/// Load a .env file into process env vars using dotenvy (handles quotes, escapes, comments).
pub fn import_env_file(path: &Path) -> anyhow::Result<()> {
    dotenvy::from_path_override(path)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn codex_home() -> std::path::PathBuf {
        dirs::home_dir().unwrap().join(".codex")
    }

    #[test]
    fn real_env_template_has_pass_refs() {
        let template = codex_home().join("env").join("dev.env");
        assert!(
            template.is_file(),
            "dev.env must exist at {}",
            template.display()
        );
        let count = pass_ref_count(&template);
        assert!(count > 0, "dev.env should have pass:// refs, got {count}");
    }

    #[test]
    fn cargo_toml_has_zero_pass_refs() {
        let cargo = Path::new(crate::PROJECTS_DIR).join("cx").join("Cargo.toml");
        assert_eq!(pass_ref_count(&cargo), 0);
    }

    #[test]
    fn missing_file_returns_zero() {
        assert_eq!(pass_ref_count(Path::new("Z:\\nonexistent\\file.env")), 0);
    }
}
