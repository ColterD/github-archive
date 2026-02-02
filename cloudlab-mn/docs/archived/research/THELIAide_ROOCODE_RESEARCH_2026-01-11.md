# TheliaIDE & Roo Code Research (2026-01-11)

## CRITICAL CLARIFICATION: "TheliaIDE" Does Not Exist

**Finding**: After extensive GitHub & web searches, **"TheliaIDE" is NOT an official product or GitHub repository**.

The term appears to be a **custom nomenclature used in your project** (via `.clinerules`, `.roomodes` files, and `README.md`) to refer to the **Roo Code ecosystem** as your "Sovereign Dev Stack."

---

## ✅ OFFICIAL REPOSITORY FOUND

### Roo Code (RooCodeInc)

**GitHub URLs:**

- **Primary Repo**: https://github.com/RooCodeInc/Roo-Code (21.7k stars, TypeScript)
- **Documentation**: https://github.com/RooCodeInc/Roo-Code-Docs (143 stars)
- **Official Docs**: https://docs.roocode.com

**Version**: v3.39.3 (as of Jan 11, 2026)
**License**: Apache 2.0

**Description**: "Roo Code gives you a whole dev team of AI agents in your code editor."

---

## 📁 RECOMMENDED FOLDER STRUCTURE FOR `.thelia/` (or `.roo/`)

### Official Roo Code Configuration Directories

```
project-root/
├── .roomodes                  # Project-level custom modes (YAML or JSON)
├── .roorules                  # Root-level fallback for mode-specific instructions
├── .roo/                      # Preferred directory for mode-specific content
│   ├── rules-{mode-slug}/     # Mode-specific instruction files (PREFERRED)
│   │   ├── 01-style-guide.md
│   │   ├── 02-formatting.txt
│   │   └── ...
│   └── rules/                 # Shared rules across all modes (optional)
├── .clinerules                # Legacy: Mode-agnostic instructions
├── .clinerules-{mode-slug}    # Legacy: Mode-specific fallback (backward compat)
└── (other project files)
```

### Your Current Structure

Your project uses `.thelia/roo_modes_config.json` instead of `.roomodes`. While this works, **the official Roo Code standard is**:

- **Preferred**: `.roomodes` (YAML or JSON) in the **project root**
- **Rules Storage**: `.roo/rules-{slug}/` directories
- **Legacy Fallback**: `.roorules-{slug}` or `.clinerules-{slug}` files

**Recommendation**: Migrate to `.roomodes` YAML for consistency with official Roo Code standards.

---

## 🎭 MODES SYSTEM (Roo Code)

### Built-in Modes (5 Default Modes)

| Mode            | Slug           | Tool Access                                      | Purpose                         |
| --------------- | -------------- | ------------------------------------------------ | ------------------------------- |
| 💻 Code         | `code`         | Full (read, edit, browser, command, mcp)         | General coding & implementation |
| 🏗️ Architect    | `architect`    | Limited (read, browser, mcp, markdown edit only) | System design & planning        |
| ❓ Ask          | `ask`          | Limited (read, browser, mcp only)                | Learning & explanations         |
| 🪲 Debug        | `debug`        | Full                                             | Troubleshooting & diagnostics   |
| 🪃 Orchestrator | `orchestrator` | Boomerang mode (delegates to other modes)        | Multi-step workflow management  |

### Custom Modes

You can define custom modes with:

- **slug**: Unique identifier (alphanumeric + hyphens only)
- **name**: Display name (with emojis supported)
- **description**: Short UI summary
- **roleDefinition**: Detailed role/personality prompt
- **whenToUse**: Guidance for automated mode selection (Orchestrator)
- **customInstructions**: Specific behavioral rules
- **groups**: Tool access control (array of strings or tuples with file restrictions)

**Your current setup** (`.thelia/roo_modes_config.json`) defines 4 custom modes:

1. `sovereign-architect`: Structure & philosophy
2. `instinct-engineer`: <50ms latency Python/Rust code
3. `cognition-reasoner`: Large context, async work
4. `scribe-auditor`: Documentation & compliance

---

## ⚙️ CONFIGURATION FILES & FORMAT

### Official Roo Code Config Files

#### 1. `.roomodes` (Project-Level, **YAML or JSON**)

**Location**: Project root

**Format**: YAML (preferred) or JSON

```yaml
customModes:
  - slug: docs-writer
    name: 📝 Documentation Writer
    description: A specialized mode for writing and editing technical documentation.
    roleDefinition: You are a technical writer specializing in clear documentation.
    whenToUse: Use this mode for writing and editing documentation.
    customInstructions: Focus on clarity and completeness in documentation.
    groups:
      - read
      - [edit, { fileRegex: '\.(md|mdx)$', description: "Markdown files only" }]
      - browser
```

**JSON Alternative**:

```json
{
  "customModes": [
    {
      "slug": "docs-writer",
      "name": "📝 Documentation Writer",
      "description": "A specialized mode for writing and editing technical documentation.",
      "roleDefinition": "You are a technical writer specializing in clear documentation.",
      "whenToUse": "Use this mode for writing and editing documentation.",
      "customInstructions": "Focus on clarity and completeness in documentation.",
      "groups": [
        "read",
        [
          "edit",
          { "fileRegex": "\\.(md|mdx)$", "description": "Markdown files only" }
        ],
        "browser"
      ]
    }
  ]
}
```

#### 2. Global Custom Modes (User-Level)

**Location**: `~/.roo/custom_modes.yaml` (or `custom_modes.json` for legacy)

- Available across all projects
- Accessed via Roo Code UI: "Edit Global Modes"

#### 3. `.roo/rules-{slug}/` Directory (Preferred)

**Location**: Project root (preferred) or `~/.roo/rules-{slug}/` (global)

**Purpose**: Mode-specific instruction files

**Example**:

```
.roo/
├── rules-docs-writer/
│   ├── 01-style-guide.md
│   ├── 02-formatting.txt
│   └── 03-tone.md
└── rules-security-reviewer/
    ├── 01-cve-checklist.md
    └── 02-owasp-compliance.md
```

Files are loaded **recursively** in **alphabetical order**.

#### 4. `.roorules-{slug}` (Fallback, Single File)

**Location**: Project root

**Purpose**: Single file fallback if `.roo/rules-{slug}/` doesn't exist

**Precedence**: Directory method takes priority over single-file method.

#### 5. `.clinerules` & `.clinerules-{slug}` (Legacy)

**Backward compatibility only**. Not recommended for new projects.

---

## 🔧 CONFIGURATION PROPERTIES REFERENCE

### slug

- **Purpose**: Unique internal identifier
- **Format**: Must match `/^[a-zA-Z0-9-]+$/` (letters, numbers, hyphens only)
- **Usage**: Referenced in file/directory names (e.g., `.roo/rules-{slug}/`)
- **Example**: `docs-writer`, `security-reviewer`

### name

- **Purpose**: Display name in Roo Code UI
- **Format**: Can include spaces, emojis, proper capitalization
- **Example**: `📝 Documentation Writer`

### description

- **Purpose**: Short summary displayed in mode selector UI
- **Format**: Concise, user-friendly
- **Example**: `A specialized mode for writing and editing technical documentation.`

### roleDefinition

- **Purpose**: Core identity and expertise (placed at beginning of system prompt)
- **Format**: Detailed personality description
- **Example**: `You are a technical writer specializing in clear documentation.`

### whenToUse (Optional)

- **Purpose**: Guidance for automated mode selection (used by Orchestrator)
- **Format**: String describing ideal use cases
- **Example**: `Use this mode for writing and editing documentation.`

### customInstructions (Optional)

- **Purpose**: Additional behavioral guidelines
- **Format**: String or multi-line YAML block
- **Example**: `Focus on clarity and completeness in documentation.`

### groups (Tool Access Control)

- **Purpose**: Define tool permissions
- **Format**: Array of strings or tuples with restrictions
- **Options**: `read`, `edit`, `browser`, `command`, `mcp`
- **File Restrictions**: Use tuples with `fileRegex` for `edit` group
- **Example**:
  ```yaml
  groups:
    - read
    - [edit, { fileRegex: '\.(js|ts)$', description: "JS/TS files only" }]
    - browser
  ```

---

## 🎯 HOW ROO CODE INTEGRATES WITH VS CODE

### Installation

1. **VS Code Marketplace**: Install `RooVeterinaryInc.roo-cline` extension
   - https://marketplace.visualstudio.com/items?itemName=RooVeterinaryInc.roo-cline
2. **OpenVSX Registry** (alternative): https://open-vsx.org/extension/RooVeterinaryInc/roo-cline

### Integration Features

- **Native VS Code Extension**: Runs directly in VS Code (Codespaces, SSH, WSL compatible)
- **Webview UI**: Chat interface with mode selector
- **Tool Integration**: File read/edit, browser, terminal commands, MCP servers
- **Persistent Configuration**: Per-project and global settings
- **Roomote Control**: Remote task orchestration via Roo Code Cloud

### **Opencode vs Roo Code**

**Opencode** appears to be a **deprecated/legacy product**. Your project's log states:

> `[x] Platform Migration: DEPRECATED opencode. ADOPTED TheliaIDE + Roo Code as Sovereign Dev Stack.`

**Roo Code** is the **modern successor**:

- ✅ Active development (6,600+ commits, weekly releases)
- ✅ Multi-agent orchestration (Boomerang/Orchestrator mode)
- ✅ Custom modes system
- ✅ MCP server support
- ✅ 21.7k GitHub stars (highly adopted)

**They do NOT run simultaneously** — Roo Code replaces opencode.

---

## 🔌 MCP (MODEL CONTEXT PROTOCOL) SUPPORT

### YES, Roo Code Supports MCP

**Tool Group**: `mcp` (included in built-in modes)

**Usage**:

- Add `mcp` to a mode's `groups` array to enable MCP server access
- Configure MCP servers in VS Code settings
- Roo Code will automatically discover and connect to MCP servers

**Example Mode with MCP**:

```yaml
customModes:
  - slug: research-agent
    name: 🔬 Research Agent
    description: Uses external MCP servers for data integration
    roleDefinition: You are a research specialist with access to external data sources.
    groups:
      - read
      - edit
      - mcp
```

---

## 🏛️ KEY CONFIGURATION PRECEDENCE

1. **Project-level modes** (`.roomodes`) → **Highest priority**
2. **Global modes** (`~/.roo/custom_modes.yaml`)
3. **Default built-in modes** → **Lowest priority**

**Important**: Project modes **completely override** global modes with the same slug (no property merging).

---

## 📋 INSTALLATION & SETUP GUIDE

### Step 1: Install Roo Code Extension

```
Install from VS Code Marketplace: RooVeterinaryInc.roo-cline
```

### Step 2: Create `.roomodes` (Project-Level Configuration)

```yaml
# .roomodes (project root)
customModes:
  - slug: sovereign-architect
    name: 🏛️ Sovereign Architect
    roleDefinition: You are the High Architect of the system...
    description: Defines structure and philosophy
    whenToUse: For architectural planning
    groups:
      - read
      - [edit, { fileRegex: '\.(md|yaml)$', description: "Docs & config only" }]
```

### Step 3: Create `.roo/rules-{slug}/` Directory

```
.roo/
└── rules-sovereign-architect/
    ├── 01-principles.md
    ├── 02-constraints.md
    └── 03-checklist.md
```

### Step 4: Configure Model Preferences (VS Code Settings)

```json
{
  "roo.models": {
    "code": "claude-3-5-sonnet",
    "architect": "gemini-2-0-flash",
    "debug": "claude-3-5-sonnet"
  }
}
```

### Step 5: (Optional) Import/Export Modes

- **Export**: Click mode → Download icon → Save `.yaml`
- **Import**: Click upload icon → Select `.yaml` → Choose scope (Project/Global)

---

## 🚀 VENDOR & MODEL REQUIREMENTS

### Supported Models

Roo Code integrates with **multiple AI vendors**:

- **OpenAI**: GPT-4, GPT-4o, o1 (preview)
- **Anthropic**: Claude 3.5 Sonnet, Opus, Haiku
- **Google**: Gemini 2.0 Flash, Pro, etc.
- **DeepSeek**: R1, V3
- **Ollama**: Local models
- **Custom API-Compatible Services** (via OpenAI-compatible interface)

### Configuration

Each mode can have a **"sticky model"** that persists:

- Set different models for different modes
- Roo Code auto-switches when changing modes
- No per-request reconfiguration needed

### API Key Setup

- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Google: `GOOGLE_API_KEY`
- Configured via VS Code settings or environment variables

---

## 📊 YOUR CURRENT SETUP ANALYSIS

### Current Files

| File                            | Status   | Alignment                                      |
| ------------------------------- | -------- | ---------------------------------------------- |
| `.thelia/roo_modes_config.json` | ✅ Works | Partially aligned (should be `.roomodes` YAML) |
| `.clinerules`                   | ✅ Works | Legacy but supported (backward compat)         |
| `AGENTS.md`                     | ✅ Works | Custom documentation (Roo-independent)         |

### Migration Recommendations

**To fully align with Roo Code standards**:

1. **Rename/Migrate Configuration**:

   - Move `.thelia/roo_modes_config.json` → `.roomodes` (YAML format)
   - Update file format from JSON to YAML (preferred by Roo Code)

2. **Create `.roo/` Directory Structure**:

   ```
   .roo/
   ├── rules-sovereign-architect/
   │   └── (move content from .clinerules)
   ├── rules-instinct-engineer/
   ├── rules-cognition-reasoner/
   └── rules-scribe-auditor/
   ```

3. **Update `.clinerules`**:
   - Keep as global instructions (non-mode-specific)
   - Or move content to `.roo/rules/` (shared across modes)

---

## 🔗 OFFICIAL RESOURCES

| Resource                | URL                                                                            |
| ----------------------- | ------------------------------------------------------------------------------ |
| **GitHub Repo**         | https://github.com/RooCodeInc/Roo-Code                                         |
| **Documentation**       | https://docs.roocode.com                                                       |
| **Docs Repo**           | https://github.com/RooCodeInc/Roo-Code-Docs                                    |
| **VS Code Marketplace** | https://marketplace.visualstudio.com/items?itemName=RooVeterinaryInc.roo-cline |
| **Discord Community**   | https://discord.gg/roocode                                                     |
| **Reddit Community**    | https://www.reddit.com/r/RooCode/                                              |
| **YouTube Channel**     | https://youtube.com/@roocodeyt                                                 |

---

## 📝 CONCLUSION

**"TheliaIDE" is your custom nomenclature for the Roo Code ecosystem** operating as your "Sovereign Dev Stack." The official product is **Roo Code**, a mature, actively-developed VS Code extension (21.7k GitHub stars, Apache 2.0 licensed).

Your current setup (`.thelia/roo_modes_config.json` + `.clinerules`) is **functional but partially non-standard**. To fully leverage Roo Code's features, migrate to:

- ✅ **`.roomodes`** (YAML preferred)
- ✅ **`.roo/rules-{slug}/`** directory structure
- ✅ **Official Roo Code configuration patterns**

**TheliaIDE exists only as your internal system naming convention.** There is no separate "TheliaIDE" GitHub repo or product to install.

---

**Verified**: 2026-01-11 (Copilot Research)
**Status**: Complete
**Next Action**: Migrate configuration to official Roo Code standards if desired.
