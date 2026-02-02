#!/usr/bin/env python3
"""
Prompt Evaluation Suite
Created: November 13, 2025
Purpose: Test prompt quality and performance
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import subprocess
import argparse

class PromptEvaluator:
    """Evaluates prompt effectiveness using test scenarios."""
    
    def __init__(self, prompts_dir: str = ".agents/prompts"):
        self.prompts_dir = Path(prompts_dir)
        self.eval_dir = self.prompts_dir / "evaluations"
        self.eval_dir.mkdir(exist_ok=True)
        
        # Load test scenarios
        self.test_scenarios = self._load_test_scenarios()
    
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
    
    def _load_test_scenarios(self) -> List[Dict]:
        """Load or create test scenarios."""
        scenarios_file = self.eval_dir / "test_scenarios.json"
        
        if scenarios_file.exists():
            with open(scenarios_file) as f:
                return json.load(f)
        
        # Default scenarios
        default_scenarios = [
            {
                "id": "autonomous_execution",
                "name": "Autonomous Multi-Step Execution",
                "description": "Agent should complete multiple steps without asking permission",
                "test_prompt": "Create a new Python function that reads a JSON file and validates the schema",
                "expected_behaviors": [
                    "Creates function without asking",
                    "Includes error handling",
                    "Adds tests",
                    "Validates result"
                ],
                "undesired_behaviors": [
                    "Asks 'would you like me to proceed?'",
                    "Stops after planning phase",
                    "Requests confirmation for each step"
                ]
            },
            {
                "id": "memory_usage",
                "name": "Memory Management",
                "description": "Agent should check and use memory file",
                "test_prompt": "What coding patterns does this project use?",
                "expected_behaviors": [
                    "Checks .agents/memory.instruction.md first",
                    "Creates file if missing",
                    "References stored preferences",
                    "Updates with new learnings"
                ],
                "undesired_behaviors": [
                    "Asks user for preferences already in memory",
                    "Ignores memory file",
                    "Overwrites existing patterns"
                ]
            },
            {
                "id": "error_recovery",
                "name": "Error Recovery & Cleanup",
                "description": "Agent should handle errors autonomously and clean up",
                "test_prompt": "Install package 'nonexistent-package-12345'",
                "expected_behaviors": [
                    "Attempts installation",
                    "Recognizes failure",
                    "Researches alternatives",
                    "Tries different approach",
                    "Cleans up failed attempts"
                ],
                "undesired_behaviors": [
                    "Gives up immediately",
                    "Leaves temporary files",
                    "Asks user what to do",
                    "Repeats same failed approach"
                ]
            },
            {
                "id": "repository_conservation",
                "name": "Repository Conservation",
                "description": "Agent should use existing tools before installing new ones",
                "test_prompt": "Add testing to this Node.js project",
                "expected_behaviors": [
                    "Checks package.json for existing test framework",
                    "Uses existing framework (Jest/Mocha/etc)",
                    "Follows existing test patterns",
                    "Avoids installing competing tools"
                ],
                "undesired_behaviors": [
                    "Installs new test framework without checking",
                    "Ignores existing tools",
                    "Creates conflicting configurations"
                ]
            },
            {
                "id": "communication_efficiency",
                "name": "Communication Efficiency",
                "description": "Agent should be concise and action-oriented",
                "test_prompt": "Fix the bug in file.js line 42",
                "expected_behaviors": [
                    "Brief statement of issue",
                    "Immediate fix",
                    "Verification",
                    "Concise summary"
                ],
                "undesired_behaviors": [
                    "Long analysis without action",
                    "Verbose explanations before fixing",
                    "Multiple summaries mid-work",
                    "Uses buzzwords (dive into, unleash, fast-paced world)"
                ]
            }
        ]
        
        # Save default scenarios
        with open(scenarios_file, 'w') as f:
            json.dump(default_scenarios, f, indent=2)
        
        return default_scenarios
    
    def evaluate_prompt(self, prompt_file: Path) -> Dict[str, Any]:
        """Evaluate a prompt against test scenarios."""
        print(f"\n{'='*60}")
        print(f"EVALUATING: {prompt_file.name}")
        print(f"{'='*60}")
        
        results = {
            "prompt_file": str(prompt_file),
            "evaluated_at": datetime.now().isoformat(),
            "scenarios": [],
            "overall_score": 0.0
        }
        
        for scenario in self.test_scenarios:
            print(f"\nScenario: {scenario['name']}")
            print(f"Description: {scenario['description']}")
            
            # Simulate test (in real implementation, would run actual agent test)
            score = self._score_scenario(prompt_file, scenario)
            
            scenario_result = {
                "id": scenario["id"],
                "name": scenario["name"],
                "score": score,
                "max_score": 10.0,
                "notes": self._generate_notes(score)
            }
            
            results["scenarios"].append(scenario_result)
            print(f"  Score: {score}/10.0")
        
        # Calculate overall score
        if results["scenarios"]:
            results["overall_score"] = sum(s["score"] for s in results["scenarios"]) / len(results["scenarios"])
        
        print(f"\n{'='*60}")
        print(f"OVERALL SCORE: {results['overall_score']:.1f}/10.0")
        print(f"{'='*60}")
        
        return results
    
    def _score_scenario(self, prompt_file: Path, scenario: Dict) -> float:
        """Score a single scenario (simplified simulation)."""
        # Read prompt content
        content = prompt_file.read_text(encoding='utf-8').lower()
        
        # Check for expected behavior keywords
        score = 5.0  # Base score
        
        expected = scenario.get("expected_behaviors", [])
        for behavior in expected:
            behavior_lower = behavior.lower()
            
            # Simple keyword matching (in production, would use actual testing)
            if "autonomous" in behavior_lower and "autonomous" in content:
                score += 0.5
            if "memory" in behavior_lower and "memory" in content:
                score += 0.5
            if "error" in behavior_lower and ("error" in content or "debug" in content):
                score += 0.5
            if "existing" in behavior_lower and ("existing" in content or "repository" in content):
                score += 0.5
            if "concise" in behavior_lower and "concise" in content:
                score += 0.5
        
        # Check for undesired patterns
        undesired = scenario.get("undesired_behaviors", [])
        for behavior in undesired:
            if "would you like" in content:
                score -= 0.5
            if "dive into" in content or "unleash" in content:
                score -= 0.3
        
        return min(max(score, 0), 10.0)
    
    def _generate_notes(self, score: float) -> str:
        """Generate notes based on score."""
        if score >= 8.0:
            return "Excellent - Meets all criteria"
        elif score >= 6.0:
            return "Good - Minor improvements needed"
        elif score >= 4.0:
            return "Acceptable - Some issues to address"
        else:
            return "Needs improvement - Major revisions required"
    
    def compare_prompts(self, prompt1: Path, prompt2: Path) -> Dict:
        """Compare two prompts side-by-side."""
        print(f"\n{'='*60}")
        print(f"COMPARING PROMPTS")
        print(f"{'='*60}")
        print(f"Prompt 1: {prompt1.name}")
        print(f"Prompt 2: {prompt2.name}")
        
        results1 = self.evaluate_prompt(prompt1)
        results2 = self.evaluate_prompt(prompt2)
        
        comparison = {
            "prompt1": prompt1.name,
            "prompt2": prompt2.name,
            "score1": results1["overall_score"],
            "score2": results2["overall_score"],
            "winner": prompt1.name if results1["overall_score"] > results2["overall_score"] else prompt2.name,
            "improvement": abs(results1["overall_score"] - results2["overall_score"])
        }
        
        print(f"\n{'='*60}")
        print(f"COMPARISON RESULTS")
        print(f"{'='*60}")
        print(f"{prompt1.name}: {results1['overall_score']:.1f}/10.0")
        print(f"{prompt2.name}: {results2['overall_score']:.1f}/10.0")
        print(f"Winner: {comparison['winner']}")
        print(f"Improvement: {comparison['improvement']:.1f} points")
        
        return comparison
    
    def save_results(self, results: Dict, output_file: str = None):
        """Save evaluation results to file."""
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = self.eval_dir / f"eval_results_{timestamp}.json"
        
        output_path = Path(output_file)
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n✓ Results saved: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Prompt evaluation suite")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # evaluate command
    eval_parser = subparsers.add_parser("evaluate", help="Evaluate a prompt")
    eval_parser.add_argument("prompt_file", help="Path to prompt file")
    eval_parser.add_argument("--save", action="store_true", help="Save results to file")
    
    # compare command
    compare_parser = subparsers.add_parser("compare", help="Compare two prompts")
    compare_parser.add_argument("prompt1", help="First prompt file")
    compare_parser.add_argument("prompt2", help="Second prompt file")
    compare_parser.add_argument("--save", action="store_true", help="Save results to file")
    
    # scenarios command
    subparsers.add_parser("scenarios", help="List test scenarios")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    evaluator = PromptEvaluator()
    
    if args.command == "evaluate":
        # Security: Validate file path string before Path operations (2025 best practice)
        validated_prompt_str = PromptEvaluator._validate_path_string(args.prompt_file, must_exist=True)
        prompt_file = Path(validated_prompt_str)
        
        # Security: Ensure it's a file (not a directory)
        if not prompt_file.is_file():
            print(f"✗ Not a file: {prompt_file}")
            sys.exit(1)
        
        results = evaluator.evaluate_prompt(prompt_file)
        
        if args.save:
            evaluator.save_results(results)
    
    elif args.command == "compare":
        # Security: Validate both file path strings before Path operations (2025 best practice)
        validated_prompt1_str = PromptEvaluator._validate_path_string(args.prompt1, must_exist=True)
        validated_prompt2_str = PromptEvaluator._validate_path_string(args.prompt2, must_exist=True)
        
        prompt1 = Path(validated_prompt1_str)
        prompt2 = Path(validated_prompt2_str)
        
        # Security: Ensure both are files (not directories)
        if not prompt1.is_file() or not prompt2.is_file():
            print("✗ One or both paths are not files")
            sys.exit(1)
        
        comparison = evaluator.compare_prompts(prompt1, prompt2)
        
        if args.save:
            evaluator.save_results(comparison)
    
    elif args.command == "scenarios":
        print(f"\n{'='*60}")
        print("TEST SCENARIOS")
        print(f"{'='*60}")
        for scenario in evaluator.test_scenarios:
            print(f"\n{scenario['id']}: {scenario['name']}")
            print(f"  {scenario['description']}")
            print(f"  Expected behaviors: {len(scenario.get('expected_behaviors', []))}")
            print(f"  Undesired behaviors: {len(scenario.get('undesired_behaviors', []))}")

if __name__ == "__main__":
    main()
