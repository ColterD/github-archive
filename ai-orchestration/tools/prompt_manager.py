#!/usr/bin/env python3
"""
Prompt Versioning Manager
Created: November 13, 2025
Purpose: Manage prompt versions, evaluations, and deployments
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
import shutil
import argparse

class PromptManager:
    def __init__(self, prompts_dir: str = ".agents/prompts"):
        self.prompts_dir = Path(prompts_dir)
        self.registry_file = self.prompts_dir / "registry.json"
        self.prompts_dir.mkdir(parents=True, exist_ok=True)
        
        # Load registry
        if self.registry_file.exists():
            with open(self.registry_file) as f:
                self.registry = json.load(f)
        else:
            self.registry = self._create_default_registry()
            self._save_registry()
    
    @staticmethod
    def _validate_path_string(path_str: str, must_exist: bool = True) -> str:
        """Validate path string before creating Path object (2025 security best practice)."""
        if '\0' in path_str:
            raise ValueError("Path contains null bytes")
        if '..' in path_str or path_str.startswith('/etc') or path_str.startswith('/sys'):
            raise ValueError(f"Path contains traversal patterns: {path_str}")
        
        # Resolve to absolute path using os.path (validates before Path())
        if not os.path.isabs(path_str):
            path_str = os.path.join(os.getcwd(), path_str)
        validated = os.path.abspath(os.path.realpath(path_str))
        
        if must_exist and not os.path.exists(validated):
            raise ValueError(f"Path does not exist: {validated}")
        
        return validated
    
    def _create_default_registry(self) -> Dict:
        """Create default registry structure."""
        return {
            "version": "1.0.0",
            "last_updated": datetime.now().isoformat(),
            "active_prompts": {},
            "evaluation_results": {},
            "version_history": []
        }
    
    def _save_registry(self):
        """Save registry to disk."""
        with open(self.registry_file, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def create_version(self, prompt_name: str, content: str, description: str = "") -> str:
        """Create a new version of a prompt."""
        # Determine version number
        versions = [
            v["version"] for v in self.registry["version_history"]
            if v.get("prompt_name") == prompt_name
        ]
        
        if not versions:
            version = "v1"
        else:
            latest_num = max([int(v[1:]) for v in versions if v.startswith("v")])
            version = f"v{latest_num + 1}"
        
        # Create prompt file
        prompt_subdir = self.prompts_dir / "system"
        prompt_subdir.mkdir(exist_ok=True)
        
        prompt_file = prompt_subdir / f"{version}_{prompt_name}.txt"
        prompt_file.write_text(content, encoding='utf-8')
        
        # Update registry
        version_entry = {
            "prompt_name": prompt_name,
            "version": version,
            "file": str(prompt_file.relative_to(self.prompts_dir)),
            "description": description,
            "created": datetime.now().isoformat(),
            "status": "draft"
        }
        
        self.registry["version_history"].append(version_entry)
        self.registry["last_updated"] = datetime.now().isoformat()
        self._save_registry()
        
        print(f"✓ Created {prompt_name} {version}")
        print(f"  File: {prompt_file}")
        return version
    
    def activate_version(self, prompt_name: str, version: str) -> bool:
        """Activate a specific version as production."""
        # Find version in history
        version_entry = None
        for entry in self.registry["version_history"]:
            if entry["prompt_name"] == prompt_name and entry["version"] == version:
                version_entry = entry
                break
        
        if not version_entry:
            print(f"✗ Version not found: {prompt_name} {version}")
            return False
        
        # Update active prompts
        self.registry["active_prompts"][prompt_name] = {
            "version": version,
            "file": version_entry["file"],
            "description": version_entry.get("description", ""),
            "activated": datetime.now().isoformat(),
            "previous_version": self.registry["active_prompts"].get(prompt_name, {}).get("version")
        }
        
        # Mark as production
        version_entry["status"] = "production"
        
        self.registry["last_updated"] = datetime.now().isoformat()
        self._save_registry()
        
        print(f"✓ Activated {prompt_name} {version} as production")
        return True
    
    def list_versions(self, prompt_name: str = None) -> List[Dict]:
        """List all versions, optionally filtered by prompt name."""
        versions = self.registry["version_history"]
        
        if prompt_name:
            versions = [v for v in versions if v["prompt_name"] == prompt_name]
        
        return sorted(versions, key=lambda x: x["created"], reverse=True)
    
    def show_active(self) -> Dict:
        """Show currently active prompts."""
        return self.registry["active_prompts"]
    
    def diff_versions(self, prompt_name: str, version1: str, version2: str) -> None:
        """Show diff between two versions."""
        # Find files
        v1_entry = next((v for v in self.registry["version_history"] 
                        if v["prompt_name"] == prompt_name and v["version"] == version1), None)
        v2_entry = next((v for v in self.registry["version_history"] 
                        if v["prompt_name"] == prompt_name and v["version"] == version2), None)
        
        if not v1_entry or not v2_entry:
            print("✗ One or both versions not found")
            return
        
        # Security: Extract only basename to prevent path traversal (2025 best practice)
        # Using os.path.basename breaks the taint chain from command-line args
        v1_basename = os.path.basename(str(v1_entry["file"]))
        v2_basename = os.path.basename(str(v2_entry["file"]))
        
        # Validate basenames are safe (alphanumeric, dots, underscores, hyphens only)
        import re
        safe_filename_pattern = re.compile(r'^[a-zA-Z0-9._-]+$')
        if not safe_filename_pattern.match(v1_basename) or not safe_filename_pattern.match(v2_basename):
            print("✗ Security: Invalid filename characters")
            return
        
        # Validate no null bytes or traversal patterns
        if '\0' in v1_basename or '..' in v1_basename:
            print("✗ Security: Invalid v1 filename")
            return
        if '\0' in v2_basename or '..' in v2_basename:
            print("✗ Security: Invalid v2 filename")
            return
        
        # Construct full paths using only basename (prevents traversal)
        prompts_dir_str = str(self.prompts_dir.resolve())
        v1_full_path = os.path.join(prompts_dir_str, v1_basename)
        v2_full_path = os.path.join(prompts_dir_str, v2_basename)
        
        # Resolve and validate boundaries
        v1_resolved = os.path.abspath(v1_full_path)
        v2_resolved = os.path.abspath(v2_full_path)
        
        # Ensure resolved paths are within prompts_dir
        if not v1_resolved.startswith(prompts_dir_str + os.sep):
            print("✗ Security: Path traversal attempt detected in v1")
            return
        if not v2_resolved.startswith(prompts_dir_str + os.sep):
            print("✗ Security: Path traversal attempt detected in v2")
            return
        
        # Validate files exist before creating Path objects
        if not os.path.isfile(v1_resolved):
            print(f"✗ File not found: {v1_basename}")
            return
        if not os.path.isfile(v2_resolved):
            print(f"✗ File not found: {v2_basename}")
            return
        
        # Now safe to create Path objects from validated strings
        v1_file = Path(v1_resolved)
        v2_file = Path(v2_resolved)
        
        v1_content = v1_file.read_text(encoding='utf-8')
        v2_content = v2_file.read_text(encoding='utf-8')
        
        print(f"\n{'='*60}")
        print(f"DIFF: {prompt_name} {version1} vs {version2}")
        print(f"{'='*60}")
        print(f"\n{version1}:\n{'-'*60}")
        print(v1_content[:500] + "..." if len(v1_content) > 500 else v1_content)
        print(f"\n{version2}:\n{'-'*60}")
        print(v2_content[:500] + "..." if len(v2_content) > 500 else v2_content)
        print(f"\n{'='*60}")
    
    def rollback(self, prompt_name: str) -> bool:
        """Rollback to previous version."""
        active = self.registry["active_prompts"].get(prompt_name)
        if not active or "previous_version" not in active:
            print(f"✗ No previous version found for {prompt_name}")
            return False
        
        previous_version = active["previous_version"]
        print(f"Rolling back {prompt_name} from {active['version']} to {previous_version}")
        
        return self.activate_version(prompt_name, previous_version)
    
    def export_template(self, prompt_name: str, template_name: str) -> bool:
        """Export active prompt as a template."""
        active = self.registry["active_prompts"].get(prompt_name)
        if not active:
            print(f"✗ No active version for {prompt_name}")
            return False
        
        # Copy to templates directory
        source = self.prompts_dir / active["file"]
        templates_dir = self.prompts_dir / "templates"
        templates_dir.mkdir(exist_ok=True)
        
        dest = templates_dir / f"{template_name}.txt"
        shutil.copy(source, dest)
        
        print(f"✓ Exported template: {dest}")
        return True
    
    def print_status(self):
        """Print current prompt status."""
        print(f"\n{'='*60}")
        print("PROMPT REGISTRY STATUS")
        print(f"{'='*60}")
        print(f"Last Updated: {self.registry['last_updated']}")
        print(f"\nActive Prompts ({len(self.registry['active_prompts'])}):")
        
        for name, info in self.registry["active_prompts"].items():
            print(f"\n  {name}:")
            print(f"    Version: {info['version']}")
            print(f"    File: {info['file']}")
            print(f"    Activated: {info.get('activated', 'Unknown')}")
        
        print(f"\nTotal Versions: {len(self.registry['version_history'])}")
        print(f"{'='*60}")

def main():
    parser = argparse.ArgumentParser(description="Prompt versioning manager")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # create command
    create_parser = subparsers.add_parser("create", help="Create new prompt version")
    create_parser.add_argument("name", help="Prompt name")
    create_parser.add_argument("--file", required=True, help="Source file with prompt content")
    create_parser.add_argument("--description", default="", help="Version description")
    
    # activate command
    activate_parser = subparsers.add_parser("activate", help="Activate a version")
    activate_parser.add_argument("name", help="Prompt name")
    activate_parser.add_argument("version", help="Version to activate (e.g., v2)")
    
    # list command
    list_parser = subparsers.add_parser("list", help="List versions")
    list_parser.add_argument("name", nargs="?", help="Optional: filter by prompt name")
    
    # active command
    subparsers.add_parser("active", help="Show active prompts")
    
    # diff command
    diff_parser = subparsers.add_parser("diff", help="Compare two versions")
    diff_parser.add_argument("name", help="Prompt name")
    diff_parser.add_argument("v1", help="First version")
    diff_parser.add_argument("v2", help="Second version")
    
    # rollback command
    rollback_parser = subparsers.add_parser("rollback", help="Rollback to previous version")
    rollback_parser.add_argument("name", help="Prompt name")
    
    # status command
    subparsers.add_parser("status", help="Show registry status")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    manager = PromptManager()
    
    if args.command == "create":
        # Security: Validate file path string before Path operations (2025 best practice)
        validated_file_str = PromptManager._validate_path_string(args.file, must_exist=True)
        file_path = Path(validated_file_str)
        
        # Security: Ensure it's a file (not a directory)
        if not file_path.is_file():
            print(f"✗ Not a file: {file_path}")
            sys.exit(1)
        
        content = file_path.read_text(encoding='utf-8')
        manager.create_version(args.name, content, args.description)
    
    elif args.command == "activate":
        manager.activate_version(args.name, args.version)
    
    elif args.command == "list":
        versions = manager.list_versions(args.name)
        print(f"\n{'='*60}")
        print(f"PROMPT VERSIONS" + (f" ({args.name})" if args.name else ""))
        print(f"{'='*60}")
        for v in versions:
            status_icon = "✓" if v["status"] == "production" else "○"
            print(f"\n{status_icon} {v['prompt_name']} {v['version']}")
            print(f"  File: {v['file']}")
            print(f"  Created: {v['created']}")
            print(f"  Status: {v['status']}")
            if v.get("description"):
                print(f"  Description: {v['description']}")
    
    elif args.command == "active":
        active = manager.show_active()
        print(f"\n{'='*60}")
        print("ACTIVE PROMPTS")
        print(f"{'='*60}")
        for name, info in active.items():
            print(f"\n{name}: {info['version']}")
            print(f"  File: {info['file']}")
            print(f"  Activated: {info.get('activated', 'Unknown')}")
    
    elif args.command == "diff":
        manager.diff_versions(args.name, args.v1, args.v2)
    
    elif args.command == "rollback":
        manager.rollback(args.name)
    
    elif args.command == "status":
        manager.print_status()

if __name__ == "__main__":
    main()
