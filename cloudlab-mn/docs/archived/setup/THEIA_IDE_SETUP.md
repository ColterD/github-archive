# Theia IDE Setup Guide for Emily Sovereign V4

**Date**: 2026-01-11
**Platform**: Windows 11 (with WSL2 / Docker available)
**Status**: Configuration Complete

---

## Overview

This workspace is now **fully configured** for Theia IDE as the universal development platform.

### What You Have

1. **`.theia/settings.json`**: IDE preferences (editor, terminal, Python/TypeScript formatting)
2. **`.theia/ai-agents.yaml`**: Custom AI agents (6 specialized roles) + LLM provider config
3. **`.theia/tasks.json`**: Predefined Theia tasks (tests, linting, Sisyphus bootstrap)
4. **`.thelia/workspace.json`**: Workspace structure + recommended extensions

---

## Quick Start (Windows)

### 1. Install Theia IDE

Download the Windows installer:

```
https://www.eclipse.org/downloads/download.php?file=/theia/ide/latest/windows/TheiaIDESetup.exe
```

Or use **Windows Package Manager**:

```powershell
winget install Eclipse.Theia
```

Or use **Docker** (if WSL2 is available):

```powershell
docker run -d -p 3000:3000 -v C:\Users\Colter\Desktop\New\ folder:/home/project theiaide/theia
# Access at: http://localhost:3000
```

### 2. Configure LLM Provider

Before opening the workspace, set your LLM credentials as **environment variables**:

```powershell
# Z.AI (GLM-4.7) - Recommended
[Environment]::SetEnvironmentVariable("ZAI_ENDPOINT", "https://api.z-ai.pro/v1", "User")
[Environment]::SetEnvironmentVariable("ZAI_API_KEY", "your-z-ai-key-here", "User")

# Or Anthropic Claude
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "your-claude-key", "User")

# Or OpenAI
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-openai-key", "User")

# Or local Ollama
[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "http://localhost:11434", "User")
```

Restart Theia after setting environment variables.

### 3. Open This Workspace

1. Launch Theia IDE
2. **File → Open Folder** → Select `C:\Users\Colter\Desktop\New folder`
3. Theia will auto-detect `.theia/` configuration
4. Recommended extensions will appear in the sidebar

### 4. Verify AI Features

1. Open the **Theia AI** panel (sidebar icon)
2. You should see 6 custom agents:

   - 🏗️ **Sovereign Architect**
   - ⚡ **Instinct Engineer**
   - 🧠 **Cognition Reasoner**
   - 📝 **Scribe Auditor**
   - 🐧 **NixOS Specialist**
   - 🏔️ **Sisyphus Oracle**
   - 🔬 **Research Analyst**

3. Select an agent and open the **Chat Panel**
4. Type a message or use a slash command (e.g., `/verify-compliance`)

---

## Key Features

### 1. Custom AI Agents (`.theia/ai-agents.yaml`)

Each agent is specialized for a specific role:

| Agent                   | Best For                              | Tools                          | Temperature |
| ----------------------- | ------------------------------------- | ------------------------------ | ----------- |
| **Sovereign Architect** | System design, AGENTS.md compliance   | Read, Browser                  | 0.7         |
| **Instinct Engineer**   | High-performance Python/Rust (<50ms)  | Read, Write, Terminal          | 0.3         |
| **Cognition Reasoner**  | Active Inference, reasoning, memory   | Read, Write, Terminal          | 0.5         |
| **Scribe Auditor**      | Documentation, compliance audits      | Read, Write                    | 0.2         |
| **NixOS Specialist**    | Infrastructure, deployment            | Read, Write, Terminal          | 0.4         |
| **Sisyphus Oracle**     | Phase 0 bootstrap, platform decisions | Read, Write, Browser, Terminal | 0.6         |
| **Research Analyst**    | Frontier research synthesis           | Read, Browser, MCP             | 0.5         |

**How to Use**:

1. Open the **Theia AI Chat** panel
2. Select an agent from the dropdown
3. Type your question or use a slash command

### 2. Slash Commands

Predefined, reusable prompts:

```
/analyze-latency       → Check latency profile of current file
/verify-compliance     → Audit against AGENTS.md
/design-system         → Design a new system component
/bootstrap-phase-0     → Initialize Phase 0 setup
```

### 3. Integrated Tasks

Run from **Terminal → Run Task**:

- **Python: Run Active Tests** → `pytest tests/`
- **Python: Type Check (mypy)** → `mypy src/ --strict`
- **Python: Lint (ruff)** → `ruff check src/`
- **Zenoh: Start Bridge** → Launch `src/kernel/zenoh_bridge.py`
- **Sisyphus: Initialize Phase 0** → Bootstrap the system
- **Scribe: Generate Daily Log** → Create `docs/notes/YYYY-MM-DD_log.md`
- **Audit: Check Architectural Compliance** → Run `scripts/governance/check_imports.py`

### 4. Python Integration

The workspace is configured for strict Python development:

- **Interpreter**: `.venv/` (auto-detected)
- **Linting**: Ruff + Pylint
- **Type Checking**: Mypy (strict mode)
- **Formatting**: Black
- **Testing**: pytest

---

## LLM Provider Configuration

The `.theia/ai-agents.yaml` expects an **OpenAI-compatible endpoint**.

### Supported Providers

1. **Z.AI (Recommended for Sovereign System)**

   ```yaml
   provider: "openai-compatible"
   apiEndpoint: "https://api.z-ai.pro/v1"
   model: "glm-4.7"
   ```

2. **Anthropic Claude**

   ```yaml
   provider: "anthropic"
   model: "claude-3.5-sonnet"
   ```

3. **OpenAI GPT-4**

   ```yaml
   provider: "openai"
   model: "gpt-4o"
   ```

4. **Local Ollama (No API Key Required)**

   ```yaml
   provider: "openai-compatible"
   apiEndpoint: "http://localhost:11434/v1"
   model: "mistral" # or any local model
   ```

5. **DeepSeek**
   ```yaml
   provider: "openai-compatible"
   apiEndpoint: "https://api.deepseek.com/v1"
   model: "deepseek-coder"
   ```

### Change Provider at Runtime

1. Open **Preferences** in Theia (`Ctrl+,` or **View → Preferences**)
2. Search: `ai-features.modelSettings`
3. Update the provider and model

---

## Advanced Configuration

### Custom MCP Integration

If you want to add **Model Context Protocol (MCP)** tools, add to `.theia/ai-agents.yaml`:

```yaml
agents:
  - id: "cognition-reasoner"
    mcp_servers:
      - name: "serena"
        command: "python"
        args: ["src/kernel/service_discovery.py"]
      - name: "docfork"
        command: "curl"
        args: ["--stdio", "https://docs.example.com"]
```

### Environment Variables

Create a `.env.local` file in the workspace root:

```bash
# Z.AI
ZAI_ENDPOINT=https://api.z-ai.pro/v1
ZAI_API_KEY=sk-...

# Alternative: Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Alternative: Local Ollama
OLLAMA_HOST=http://localhost:11434
```

Theia will automatically inject these into the AI agent sessions.

---

## Troubleshooting

### "Theia AI features not available"

- **Check**: Preferences → `ai-features.enabled` = `true`
- **Check**: LLM provider credentials are set (environment variables or settings)
- **Restart**: Theia IDE after changing settings

### "Custom agents not showing up"

- **Check**: `.theia/ai-agents.yaml` is valid YAML (use online validator)
- **Check**: Agent IDs are unique
- **Restart**: Theia AI panel

### "Tasks not running"

- **Check**: `.theia/tasks.json` is valid JSON
- **Check**: Python environment (`.venv/`) is activated
- **Restart**: Terminal in Theia

### "Latency agent suggests incorrect changes"

- **Problem**: Agent has old context
- **Solution**: In chat, say: "Reload file context" or close/reopen the file

---

## Workflow: Using Theia for Emily Development

### Scenario 1: Designing a new system component

1. Open the **Theia AI Chat**
2. Select: **🏗️ Sovereign Architect**
3. Type: `/design-system` + describe your component
4. Agent returns: Architecture diagram (Mermaid), specification, rationale
5. Scribe: Use **📝 Scribe Auditor** to log the decision

### Scenario 2: Implementing low-latency code

1. Create file in `src/instinct/`
2. Open **Theia AI Chat**
3. Select: **⚡ Instinct Engineer**
4. Paste your code or describe the requirement
5. Agent generates: Type-safe, latency-compliant code with docstrings
6. Run task: **Python: Type Check (mypy)** to verify

### Scenario 3: Debugging Active Inference

1. Open file in `src/cognition/logic/agency.py`
2. Select code snippet
3. Open **Theia AI Chat**
4. Select: **🧠 Cognition Reasoner**
5. Use slash command: `/verify-compliance`
6. Agent audits: Free Energy constraints, neurotransmitter usage, Zenoh integration

### Scenario 4: Bootstrap new environment (WSL2 vs Docker)

1. Open **Theia AI Chat**
2. Select: **🏔️ Sisyphus Oracle**
3. Type: "Should we use WSL2 or Docker for the NixOS bridge?"
4. Agent returns: Decision matrix + playbook for implementation

---

## Next Steps

1. **Install Thelia IDE** from the official source above
2. **Set LLM credentials** as environment variables
3. **Open this workspace** in Thelia
4. **Verify AI agents** appear in the Chat panel
5. **Run a test task** to confirm integration
6. **Start using agents** for development

---

## Documentation References

- **Theia IDE Official Docs**: https://theia-ide.org/docs
- **Theia AI Framework**: https://theia-ide.org/docs/theia_ai
- **VS Code API Compatibility**: https://eclipse-theia.github.io/vscode-theia-comparator/status.html
- **Theia GitHub**: https://github.com/eclipse-theia/theia
- **Emily Sovereign AGENTS.md**: See `AGENTS.md` in workspace root

---

**Configuration Date**: 2026-01-11
**Status**: ✅ Ready for use
**Next**: Open in Theia IDE and start development
