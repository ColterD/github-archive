use assert_cmd::cargo::cargo_bin_cmd;
use predicates::prelude::*;

fn cx() -> assert_cmd::Command {
    cargo_bin_cmd!("cx")
}

#[test]
fn version_exits_ok() {
    cx().arg("--version")
        .assert()
        .success()
        .stdout(predicate::str::contains("cx"));
}

#[test]
fn help_exits_ok() {
    cx().arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Codex launcher"));
}

#[test]
fn heal_lists_without_error() {
    cx().arg("heal")
        .assert()
        .success()
        .stdout(predicate::str::contains("cx heal"));
}

#[test]
fn find_existing_project() {
    cx().args(["find", "cx"])
        .assert()
        .success()
        .stdout(predicate::str::contains("cx"));
}

#[test]
fn find_no_match() {
    cx().args(["find", "nonexistent-repo-xyz-99"])
        .assert()
        .success()
        .stdout(predicate::str::contains("no matching projects found"));
}

#[test]
fn doctor_runs_without_panic() {
    let output = cx().arg("doctor").output().unwrap();
    let code = output.status.code().unwrap();
    // doctor exits 0 (all ok) or 2 (some checks failed) — both are fine
    assert!(code == 0 || code == 2, "unexpected exit code: {code}");
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("cx doctor"));
}

#[test]
fn open_nonexistent_fails() {
    cx().args(["open", "nonexistent-repo-xyz-99"])
        .assert()
        .failure();
}

#[test]
fn work_nonexistent_fails() {
    cx().args(["work", "nonexistent-repo-xyz-99"])
        .assert()
        .failure();
}

#[test]
fn do_missing_message_fails() {
    cx().arg("do").assert().failure();
}
