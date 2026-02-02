#!/usr/bin/env python3
"""
Automated Security Scanner
Created: November 13, 2025
Purpose: Comprehensive security scanning for SAST, SCA, secrets detection, IaC
"""

import subprocess
import sys
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import argparse
import os

class SecurityScanner:
    @staticmethod
    def _validate_path_string(path_str: str, must_exist: bool = True) -> str:
        """
        Validate path string BEFORE creating Path object (2025 best practice).
        Prevents path traversal by checking for dangerous patterns.
        """
        # Security: Reject null bytes
        if '\0' in path_str:
            raise ValueError("Path contains null bytes")
        
        # Security: Reject obvious traversal attempts
        if '..' in path_str or path_str.startswith('/etc') or path_str.startswith('/sys'):
            raise ValueError(f"Path contains traversal patterns: {path_str}")
        
        # Security: Must be absolute or relative to cwd only
        if not os.path.isabs(path_str) and not path_str.startswith('./'):
            # Make it explicitly relative to cwd
            path_str = os.path.join(os.getcwd(), path_str)
        
        # Now safe to convert to Path and validate
        validated = os.path.abspath(os.path.realpath(path_str))
        
        if must_exist and not os.path.exists(validated):
            raise ValueError(f"Path does not exist: {validated}")
        
        return validated
    
    def __init__(self, project_path: str, output_dir: str = "./security-reports"):
        # Validate strings BEFORE converting to Path objects
        validated_project = self._validate_path_string(project_path, must_exist=True)
        validated_output = self._validate_path_string(output_dir, must_exist=False)
        
        # Now safe to use validated paths
        self.project_path = Path(validated_project)
        self.output_dir = Path(validated_output)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "project": str(self.project_path),
            "scans": {}
        }
    
    def _safe_file_path(self, filename: str) -> Path:
        """
        Safely construct file path within output_dir.
        2025 best practice: Validate string BEFORE Path operations.
        """
        # Security: Validate filename string first
        if '\0' in filename or '/' in filename or '\\' in filename or '..' in filename:
            raise ValueError(f"Invalid filename: {filename}")
        
        # Build safe path string first
        safe_path_str = os.path.join(str(self.output_dir), filename)
        validated = os.path.abspath(os.path.realpath(safe_path_str))
        
        # Ensure it's within output_dir
        if not validated.startswith(str(self.output_dir.resolve())):
            raise ValueError(f"Path traversal attempt: {filename}")
        
        return Path(validated)
        
    def run_command(self, cmd: List[str], name: str) -> Dict[str, Any]:
        """Run command and capture output."""
        print(f"\n{'='*60}")
        print(f"Running {name}...")
        print(f"{'='*60}")
        
        try:
            result = subprocess.run(
                cmd,
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes max per scan
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Timeout (5 minutes exceeded)",
                "exit_code": -1
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "exit_code": -1
            }
    
    def scan_snyk_code(self) -> bool:
        """SAST: Scan source code for security vulnerabilities."""
        print("\n🔍 SAST: Scanning source code with Snyk Code...")
        
        result = self.run_command(
            ["snyk", "code", "test", "--json"],
            "Snyk Code (SAST)"
        )
        
        if result["success"] or result["exit_code"] == 1:  # Exit 1 = vulnerabilities found
            try:
                data = json.loads(result["stdout"]) if result["stdout"] else {}
                self.results["scans"]["sast"] = {
                    "tool": "Snyk Code",
                    "status": "completed",
                    "vulnerabilities_found": len(data.get("runs", [{}])[0].get("results", [])) if data else 0,
                    "details": data
                }
                
                # Save detailed report using safe path helper
                report_file = self._safe_file_path(f"sast_snyk_{self.timestamp}.json")
                with open(report_file, 'w') as f:
                    json.dump(data, f, indent=2)
                
                vuln_count = self.results["scans"]["sast"]["vulnerabilities_found"]
                print(f"✓ SAST scan complete: {vuln_count} issues found")
                print(f"  Report: {report_file}")
                return True
            except json.JSONDecodeError:
                print("⚠ SAST scan ran but output format unexpected")
                self.results["scans"]["sast"] = {
                    "tool": "Snyk Code",
                    "status": "completed_with_warnings",
                    "raw_output": result["stdout"][:500]
                }
                return True
        else:
            print(f"✗ SAST scan failed: {result.get('error', result['stderr'])}")
            self.results["scans"]["sast"] = {
                "tool": "Snyk Code",
                "status": "failed",
                "error": result.get("error", result["stderr"])
            }
            return False
    
    def scan_snyk_dependencies(self) -> bool:
        """SCA: Scan dependencies for known vulnerabilities."""
        print("\n📦 SCA: Scanning dependencies with Snyk...")
        
        result = self.run_command(
            ["snyk", "test", "--all-projects", "--json"],
            "Snyk SCA"
        )
        
        if result["success"] or result["exit_code"] == 1:
            try:
                data = json.loads(result["stdout"]) if result["stdout"] else {}
                
                # Count vulnerabilities across all projects
                total_vulns = 0
                if isinstance(data, list):
                    for project in data:
                        total_vulns += len(project.get("vulnerabilities", []))
                else:
                    total_vulns = len(data.get("vulnerabilities", []))
                
                self.results["scans"]["sca"] = {
                    "tool": "Snyk",
                    "status": "completed",
                    "vulnerabilities_found": total_vulns,
                    "details": data
                }
                
                # Save detailed report using safe path helper
                report_file = self._safe_file_path(f"sca_snyk_{self.timestamp}.json")
                with open(report_file, 'w') as f:
                    json.dump(data, f, indent=2)
                
                print(f"✓ SCA scan complete: {total_vulns} vulnerable dependencies found")
                print(f"  Report: {report_file}")
                return True
            except json.JSONDecodeError:
                print("⚠ SCA scan ran but output format unexpected")
                self.results["scans"]["sca"] = {
                    "tool": "Snyk",
                    "status": "completed_with_warnings",
                    "raw_output": result["stdout"][:500]
                }
                return True
        else:
            print(f"✗ SCA scan failed: {result.get('error', result['stderr'])}")
            self.results["scans"]["sca"] = {
                "tool": "Snyk",
                "status": "failed",
                "error": result.get("error", result["stderr"])
            }
            return False
    
    def scan_secrets(self) -> bool:
        """Secrets Detection: Scan for exposed credentials."""
        print("\n🔑 Secrets: Scanning for exposed credentials with TruffleHog...")
        
        # Use TruffleHog in Docker (no installation required)
        result = self.run_command(
            [
                "docker", "run", "--rm",
                "-v", f"{self.project_path}:/target:ro",
                "trufflesecurity/trufflehog:latest",
                "filesystem", "/target",
                "--json", "--only-verified"
            ],
            "TruffleHog Secrets Detection"
        )
        
        if result["success"]:
            # Parse JSON output (one JSON object per line)
            secrets = []
            if result["stdout"]:
                for line in result["stdout"].strip().split('\n'):
                    if line.strip():
                        try:
                            secrets.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue
            
            self.results["scans"]["secrets"] = {
                "tool": "TruffleHog",
                "status": "completed",
                "secrets_found": len(secrets),
                "details": secrets
            }
            
            # Save detailed report using safe path helper
            if secrets:
                report_file = self._safe_file_path(f"secrets_trufflehog_{self.timestamp}.json")
                with open(report_file, 'w') as f:
                    json.dump(secrets, f, indent=2)
                print(f"✗ Secrets scan complete: {len(secrets)} VERIFIED secrets found!")
                print(f"  ⚠ URGENT: Review and rotate these credentials immediately")
                print(f"  Report: {report_file}")
            else:
                print(f"✓ Secrets scan complete: No verified secrets found")
            
            return True
        else:
            print(f"⚠ Secrets scan had issues: {result.get('error', result['stderr'])}")
            self.results["scans"]["secrets"] = {
                "tool": "TruffleHog",
                "status": "failed",
                "error": result.get("error", result["stderr"])
            }
            return False
    
    def scan_docker_images(self) -> bool:
        """Container Security: Scan Docker images for vulnerabilities."""
        print("\n🐳 Docker: Scanning container images with Snyk...")
        
        # Get list of images from docker-compose
        compose_file = self.project_path / "docker-compose.yml"
        if not compose_file.exists():
            print("⚠ No docker-compose.yml found, skipping container scan")
            self.results["scans"]["containers"] = {
                "status": "skipped",
                "reason": "No docker-compose.yml found"
            }
            return True
        
        # Scan with Snyk (looks for docker-compose.yml automatically)
        result = self.run_command(
            ["snyk", "container", "test", "--file=docker-compose.yml", "--json"],
            "Snyk Container"
        )
        
        if result["success"] or result["exit_code"] == 1:
            try:
                data = json.loads(result["stdout"]) if result["stdout"] else {}
                vuln_count = len(data.get("vulnerabilities", []))
                
                self.results["scans"]["containers"] = {
                    "tool": "Snyk Container",
                    "status": "completed",
                    "vulnerabilities_found": vuln_count,
                    "details": data
                }
                
                # Save detailed report using safe path helper
                report_file = self._safe_file_path(f"containers_snyk_{self.timestamp}.json")
                with open(report_file, 'w') as f:
                    json.dump(data, f, indent=2)
                
                print(f"✓ Container scan complete: {vuln_count} image vulnerabilities found")
                print(f"  Report: {report_file}")
                return True
            except json.JSONDecodeError:
                print("⚠ Container scan ran but output format unexpected")
                self.results["scans"]["containers"] = {
                    "tool": "Snyk Container",
                    "status": "completed_with_warnings",
                    "raw_output": result["stdout"][:500]
                }
                return True
        else:
            print(f"⚠ Container scan had issues (may not have Snyk auth): {result.get('error', '')}")
            self.results["scans"]["containers"] = {
                "tool": "Snyk Container",
                "status": "partial",
                "note": "May require Snyk authentication"
            }
            return True
    
    def generate_summary(self) -> str:
        """Generate human-readable summary."""
        summary = [
            "\n" + "="*60,
            "SECURITY SCAN SUMMARY",
            "="*60,
            f"Project: {self.project_path}",
            f"Timestamp: {self.results['timestamp']}",
            "\nResults:"
        ]
        
        total_issues = 0
        critical_issues = 0
        
        for scan_type, scan_data in self.results["scans"].items():
            status_icon = "✓" if scan_data["status"] == "completed" else "⚠"
            summary.append(f"\n{status_icon} {scan_type.upper()}: {scan_data.get('tool', 'Unknown')}")
            
            if "vulnerabilities_found" in scan_data:
                count = scan_data["vulnerabilities_found"]
                total_issues += count
                summary.append(f"  Issues: {count}")
            
            if "secrets_found" in scan_data:
                count = scan_data["secrets_found"]
                critical_issues += count
                total_issues += count
                summary.append(f"  Secrets: {count} (CRITICAL!)")
        
        summary.extend([
            "\n" + "-"*60,
            f"TOTAL ISSUES: {total_issues}",
            f"CRITICAL: {critical_issues}" if critical_issues > 0 else "",
            "-"*60,
            f"\nDetailed reports saved to: {self.output_dir}",
            "="*60
        ])
        
        return "\n".join(s for s in summary if s)
    
    def save_results(self):
        """Save consolidated results using safe path helper."""
        results_file = self._safe_file_path(f"security_scan_{self.timestamp}.json")
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Consolidated results: {results_file}")
    
    def run_all_scans(self, skip_docker: bool = False) -> bool:
        """Run all security scans."""
        print(f"\n🔒 Starting comprehensive security scan...")
        print(f"Project: {self.project_path}")
        
        # Run all scans
        self.scan_snyk_code()
        self.scan_snyk_dependencies()
        self.scan_secrets()
        
        if not skip_docker:
            self.scan_docker_images()
        
        # Generate and save results
        self.save_results()
        summary = self.generate_summary()
        print(summary)
        
        # Save summary to text file using safe path helper
        summary_file = self._safe_file_path(f"summary_{self.timestamp}.txt")
        with open(summary_file, 'w') as f:
            f.write(summary)
        
        # Determine overall success
        any_critical = any(
            scan.get("secrets_found", 0) > 0 
            for scan in self.results["scans"].values()
        )
        
        if any_critical:
            print("\n⚠ CRITICAL: Secrets detected! Immediate action required.")
            return False
        
        total_vulns = sum(
            scan.get("vulnerabilities_found", 0)
            for scan in self.results["scans"].values()
        )
        
        if total_vulns > 0:
            print(f"\n⚠ {total_vulns} security issues found. Review reports for details.")
        else:
            print("\n✓ No security issues detected!")
        
        return True

def main():
    parser = argparse.ArgumentParser(description="Comprehensive security scanner")
    parser.add_argument("project_path", nargs="?", default=".", help="Path to project to scan")
    parser.add_argument("--output-dir", default="./security-reports", help="Output directory for reports")
    parser.add_argument("--skip-docker", action="store_true", help="Skip Docker image scanning")
    
    args = parser.parse_args()
    
    scanner = SecurityScanner(args.project_path, args.output_dir)
    success = scanner.run_all_scans(skip_docker=args.skip_docker)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
