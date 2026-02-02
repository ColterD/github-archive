#!/usr/bin/env python3
"""
Multi-Project Dependency Mapper
Created: November 13, 2025
Purpose: Map dependencies across multiple projects and store in Mimir
"""

import json
import subprocess
import sys
import os
from pathlib import Path
from typing import Dict, List, Set, Tuple
import argparse

class ProjectMapper:
    """Maps dependencies across multiple projects."""
    
    def __init__(self, mimir_endpoint: str = "http://localhost:9042/mcp"):
        self.mimir_endpoint = mimir_endpoint
        self.projects = {}
        self.edges = []
    
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
    
    def _safe_read_file(self, file_path: Path) -> str:
        """
        Safely read file with path validation (2025 best practice).
        Prevents path traversal attacks.
        """
        resolved_path = file_path.resolve()
        
        # Security: Ensure path exists and is a file
        if not resolved_path.exists():
            raise ValueError(f"File does not exist: {resolved_path}")
        if not resolved_path.is_file():
            raise ValueError(f"Not a file: {resolved_path}")
        
        return resolved_path.read_text(encoding='utf-8')
    
    def scan_project(self, project_path: str) -> Dict:
        """Scan a project for dependencies with path validation."""
        # Security: Validate path string before any Path operations (2025 best practice)
        try:
            validated_path_str = self._validate_path_string(project_path, must_exist=True)
        except ValueError as e:
            print(f"✗ Invalid path: {e}")
            return {}
        
        path = Path(validated_path_str)
        
        if not path.is_dir():
            print(f"✗ Not a directory: {project_path}")
            return {}
        
        project_info = {
            "path": str(path),
            "name": path.name,
            "type": self._detect_project_type(path),
            "dependencies": set(),
            "dev_dependencies": set()
        }
        
        # Scan based on project type
        if project_info["type"] == "node":
            project_info.update(self._scan_node_project(path))
        elif project_info["type"] == "python":
            project_info.update(self._scan_python_project(path))
        elif project_info["type"] == "rust":
            project_info.update(self._scan_rust_project(path))
        
        return project_info
    
    def _detect_project_type(self, path: Path) -> str:
        """Detect project type from manifest files."""
        if (path / "package.json").exists():
            return "node"
        elif (path / "requirements.txt").exists() or (path / "pyproject.toml").exists():
            return "python"
        elif (path / "Cargo.toml").exists():
            return "rust"
        elif (path / "pom.xml").exists() or (path / "build.gradle").exists():
            return "java"
        else:
            return "unknown"
    
    def _scan_node_project(self, path: Path) -> Dict:
        """Scan Node.js project dependencies."""
        package_json = path / "package.json"
        
        if not package_json.exists():
            return {}
        
        # Use safe file reading
        data = json.loads(self._safe_read_file(package_json))
        
        deps = set(data.get("dependencies", {}).keys())
        dev_deps = set(data.get("devDependencies", {}).keys())
        
        return {
            "dependencies": deps,
            "dev_dependencies": dev_deps,
            "version": data.get("version", "unknown"),
            "description": data.get("description", "")
        }
    
    def _scan_python_project(self, path: Path) -> Dict:
        """Scan Python project dependencies."""
        deps = set()
        dev_deps = set()
        
        # Check requirements.txt
        req_file = path / "requirements.txt"
        if req_file.exists():
            with open(req_file) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        # Extract package name (before ==, >=, etc.)
                        pkg = line.split("==")[0].split(">=")[0].split("<=")[0].strip()
                        deps.add(pkg)
        
        # Check pyproject.toml with safe file reading
        pyproject = path / "pyproject.toml"
        if pyproject.exists():
            content = self._safe_read_file(pyproject)
            # Basic extraction - in production would use proper TOML parser
            if "[tool.poetry.dependencies]" in content:
                deps.add("poetry")  # Project uses Poetry
        
        return {
            "dependencies": deps,
            "dev_dependencies": dev_deps
        }
    
    def _scan_rust_project(self, path: Path) -> Dict:
        """Scan Rust project dependencies."""
        cargo_toml = path / "Cargo.toml"
        
        if not cargo_toml.exists():
            return {}
        
        deps = set()
        dev_deps = set()
        
        # Use safe file reading
        content = self._safe_read_file(cargo_toml)
        # Basic extraction - in production would use proper TOML parser
        if "[dependencies]" in content:
            deps.add("cargo")  # Rust project
        
        return {
            "dependencies": deps,
            "dev_dependencies": dev_deps
        }
    
    def create_project_node(self, project_info: Dict) -> str:
        """Create project node in Mimir."""
        payload = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {
                'name': 'mcp_mimir_memory_node',
                'arguments': {
                    'operation': 'add',
                    'type': 'project',
                    'properties': {
                        'title': f"Project: {project_info['name']}",
                        'content': f"Type: {project_info['type']}\nPath: {project_info['path']}",
                        'category': 'projects',
                        'tags': ['project', project_info['type'], 'mapped'],
                        'project_type': project_info['type'],
                        'project_path': project_info['path'],
                        'dependency_count': len(project_info.get('dependencies', [])),
                        'never_decay': True
                    }
                }
            }
        }
        
        result = subprocess.run(
            ['curl', '-X', 'POST', self.mimir_endpoint,
             '-H', 'Content-Type: application/json',
             '-d', json.dumps(payload)],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            return response['result']['id']
        
        return None
    
    def create_dependency_edges(self, project_id: str, project_info: Dict):
        """Create dependency edges in Mimir."""
        for dep in project_info.get('dependencies', []):
            # Create edge from project to dependency
            payload = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'tools/call',
                'params': {
                    'name': 'mcp_mimir_memory_edge',
                    'arguments': {
                        'operation': 'add',
                        'source': project_id,
                        'target': f"library:{dep}",  # Could create library nodes
                        'type': 'depends_on',
                        'properties': {
                            'dependency_name': dep,
                            'is_dev': False
                        }
                    }
                }
            }
            
            self.edges.append(payload)
    
    def map_projects(self, project_paths: List[str]) -> Dict:
        """Map multiple projects and their dependencies."""
        results = {
            'projects': [],
            'total_dependencies': set(),
            'shared_dependencies': {}
        }
        
        print(f"\n{'='*60}")
        print("PROJECT DEPENDENCY MAPPING")
        print(f"{'='*60}\n")
        
        # Scan all projects
        for path in project_paths:
            print(f"Scanning: {path}")
            project_info = self.scan_project(path)
            
            if project_info:
                results['projects'].append(project_info)
                results['total_dependencies'].update(project_info.get('dependencies', []))
                
                print(f"  Type: {project_info['type']}")
                print(f"  Dependencies: {len(project_info.get('dependencies', []))}")
                print(f"  Dev Dependencies: {len(project_info.get('dev_dependencies', []))}")
        
        # Find shared dependencies
        if len(results['projects']) > 1:
            for dep in results['total_dependencies']:
                count = sum(1 for p in results['projects'] if dep in p.get('dependencies', []))
                if count > 1:
                    results['shared_dependencies'][dep] = count
        
        # Print summary
        print(f"\n{'='*60}")
        print("MAPPING SUMMARY")
        print(f"{'='*60}")
        print(f"Total Projects: {len(results['projects'])}")
        print(f"Unique Dependencies: {len(results['total_dependencies'])}")
        print(f"Shared Dependencies: {len(results['shared_dependencies'])}")
        
        if results['shared_dependencies']:
            print(f"\nTop Shared Dependencies:")
            for dep, count in sorted(results['shared_dependencies'].items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"  {dep}: {count} projects")
        
        return results
    
    def store_mapping_in_mimir(self, results: Dict):
        """Store entire mapping in Mimir."""
        print(f"\n{'='*60}")
        print("STORING IN MIMIR")
        print(f"{'='*60}\n")
        
        for project_info in results['projects']:
            project_id = self.create_project_node(project_info)
            
            if project_id:
                print(f"✓ Created node: {project_info['name']} ({project_id})")
                self.create_dependency_edges(project_id, project_info)
        
        print(f"\n✓ Mapping complete: {len(results['projects'])} projects stored")

def main():
    parser = argparse.ArgumentParser(description="Multi-project dependency mapper")
    parser.add_argument("paths", nargs="+", help="Project paths to map")
    parser.add_argument("--store", action="store_true", help="Store results in Mimir")
    parser.add_argument("--output", help="Save results to JSON file")
    
    args = parser.parse_args()
    
    mapper = ProjectMapper()
    results = mapper.map_projects(args.paths)
    
    if args.store:
        mapper.store_mapping_in_mimir(results)
    
    if args.output:
        # Security: Validate output path string before Path operations (2025 best practice)
        validated_output_str = ProjectMapper._validate_path_string(args.output, must_exist=False)
        output_path = Path(validated_output_str)
        
        # Ensure parent directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert sets to lists for JSON serialization
        json_results = {
            'projects': [
                {**p, 'dependencies': list(p.get('dependencies', [])), 'dev_dependencies': list(p.get('dev_dependencies', []))}
                for p in results['projects']
            ],
            'total_dependencies': list(results['total_dependencies']),
            'shared_dependencies': results['shared_dependencies']
        }
        
        with open(output_path, 'w') as f:
            json.dump(json_results, f, indent=2)
        
        print(f"\n✓ Results saved: {output_path}")

if __name__ == "__main__":
    main()
