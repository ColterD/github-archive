#!/usr/bin/env python3
"""
Store prompt versioning documentation in Mimir
"""
import json
import subprocess
import sys

# Prepare payload for Mimir
title = 'Prompt Versioning System - Git-Style Version Control for AI Prompts'
content = '''
## Overview
Complete prompt versioning system with Git-style version control, evaluation suite, and A/B testing capabilities.

## Key Features
- Version tracking (v1, v2, v3...)
- Production/staging/dev environments
- A/B testing capabilities
- Automated quality evaluation (5 test scenarios)
- Rollback support
- Template management (code review, security analysis)

## CLI Commands (via m.ps1)

### Version Management
- .\\m.ps1 prompt-version status - Show registry status
- .\\m.ps1 prompt-version create <name> --file <path> --description "desc" - Create new version
- .\\m.ps1 prompt-version activate <name> <version> - Activate version as production
- .\\m.ps1 prompt-version list [name] - List all versions (optionally filtered)
- .\\m.ps1 prompt-version active - Show active prompts
- .\\m.ps1 prompt-version diff <name> <v1> <v2> - Compare two versions
- .\\m.ps1 prompt-version rollback <name> - Rollback to previous version

### Evaluation
- .\\m.ps1 prompt-eval <file> - Evaluate prompt quality (saves results automatically)

## Test Scenarios (Automated Quality Checks)
1. **Autonomous Multi-Step Execution** - Tests if agent works without asking permission
2. **Memory Management** - Tests if .agents/memory.instruction.md is used properly
3. **Error Recovery & Cleanup** - Tests autonomous error handling and cleanup
4. **Repository Conservation** - Tests if existing tools are used before installing new ones
5. **Communication Efficiency** - Tests concise, action-oriented communication

## Scoring System
Each scenario scored 0-10:
- 8-10: Excellent - Meets all criteria
- 6-7.9: Good - Minor improvements needed
- 4-5.9: Acceptable - Some issues to address
- 0-3.9: Needs improvement - Major revisions required

## Directory Structure
.agents/prompts/
├── registry.json - Active versions and metadata
├── system/ - Versioned system prompts (v1_coding_agent.txt, v2_coding_agent.txt, v3_coding_agent.txt)
├── templates/ - Reusable templates (code_review_template.txt, security_analysis_template.txt)
└── evaluations/ - Test suite and results

## Current Production Prompt
- Name: system_prompt
- Version: v3 (Claudette v5.2.1)
- File: .agents/prompts/system/v3_coding_agent.txt
- Features: Excellent memory management, autonomous operation, Mimir integration

## Tools
- prompt_manager.py (395 lines) - Version management, activation, rollback
- prompt_evaluator.py (310 lines) - Quality evaluation, A/B testing, scenario testing

## Workflow Example
1. Edit prompt in editor: code new_prompt.txt
2. Create version: .\\m.ps1 prompt-version create coding_agent --file new_prompt.txt --description "Improved error handling"
3. Evaluate: .\\m.ps1 prompt-eval .agents\\prompts\\system\\v4_coding_agent.txt
4. Compare: python tools\\prompt_evaluator.py compare v3_coding_agent.txt v4_coding_agent.txt
5. Activate if better: .\\m.ps1 prompt-version activate coding_agent v4
6. Rollback if issues: .\\m.ps1 prompt-version rollback coding_agent

## Best Practices
- Version everything (never edit production prompts directly)
- Test before deploy (always evaluate new versions)
- Compare systematically (use diff and comparison tools)
- Document changes (add meaningful descriptions)
- Keep history (never delete old versions)
- Rollback ready (always know your previous version)
- Template reuse (export successful prompts as templates)

## Integration Points
- Mimir MCP Server: Store prompt performance data
- Neo4j: Track version relationships
- Git: External version control (optional)
- Docker: Containerized evaluation environment (future)
'''

metadata = {
    'created_date': '2025-11-13',
    'tool_count': 2,
    'location': '.agents/prompts/',
    'integration': 'm.ps1 CLI',
    'test_scenarios': 5,
    'current_production': 'v3_coding_agent.txt'
}

tags = ['prompt-engineering', 'versioning', 'quality-assurance', 'a-b-testing', 'automation', 'tools']

payload = {
    'jsonrpc': '2.0',
    'id': 1,
    'method': 'tools/call',
    'params': {
        'name': 'mcp_mimir_memory_node',
        'arguments': {
            'operation': 'add',
            'type': 'memory',
            'properties': {
                'title': title,
                'content': content,
                'category': 'tools',
                'tags': tags,
                'metadata': json.dumps(metadata),
                'quality_score': 9.5,
                'never_decay': True
            }
        }
    }
}

# Call Mimir MCP
result = subprocess.run(
    ['curl', '-X', 'POST', 'http://localhost:9042/mcp',
     '-H', 'Content-Type: application/json',
     '-d', json.dumps(payload)],
    capture_output=True,
    text=True
)

if result.returncode == 0:
    print('✓ Stored prompt versioning documentation in Mimir')
    try:
        response = json.loads(result.stdout)
        if 'result' in response:
            print(f"  Node ID: {response['result'].get('id', 'unknown')}")
    except:
        print(f"  Response: {result.stdout[:200]}")
else:
    print(f'✗ Failed to store in Mimir: {result.stderr}')
    sys.exit(1)
