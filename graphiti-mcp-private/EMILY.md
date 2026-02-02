# Emily's Graphiti Fork

> **Private fork of [getzep/graphiti](https://github.com/getzep/graphiti)**
> Customized for Emily's memory system with enhanced MCP tools.

## What's Different in This Fork

| Enhancement | Description |
|-------------|-------------|
| Total count tracking | `search_memory_facts` returns `retrieved`, `total_found`, `has_more` |
| Entity type filtering | Filter by Preference, Decision, Gotcha, Lesson, etc. |
| Temporal queries | `search_facts_by_time` for "What did I learn last week?" |
| Focal entity search | `search_from_entity` for Colter-centric searches |
| Community building | `build_communities` for knowledge clustering |
| Advanced search recipes | `search_with_recipe` for different search strategies |
| 16 entity types | Production types from Zep + Emily's custom types |

## For Emily: How to Use Memory

### Session Start (MANDATORY)
Always begin with a memory search to recover context:
```
search_memory_facts("Colter preferences recent context", group_ids=["emily"])
```

### When to Save Memories
Save IMMEDIATELY when you learn:
- **Preferences**: Tools, libraries, coding style ("Colter prefers pnpm")
- **Decisions**: Architectural choices with rationale
- **Gotchas**: Non-obvious behaviors, bugs, quirks
- **Lessons**: Mistakes and what was learned
- **Remember**: Anything explicitly requested

```python
add_memory(
    name="Colter prefers pnpm",
    episode_body="Colter mentioned he prefers pnpm over npm for package management",
    group_id="emily"
)
```

### Available Search Tools

| Tool | Use When |
|------|----------|
| `search_memory_facts` | General fact search (default) |
| `search_from_entity` | Searching about specific person/project |
| `search_facts_by_time` | "What did I learn last week?" |
| `search_with_recipe` | Advanced search strategies |
| `search_nodes` | Find entities by name |
| `get_episodes` | Recent conversation history |
| `get_episode_content` | See what was extracted from an episode |
| `build_communities` | Cluster related knowledge |

### Advanced Search Examples

```python
# Find facts from last week
search_facts_by_time(created_after="2025-12-11T00:00:00Z")

# Search from Colter's perspective
search_from_entity(query="preferences", entity_name="Colter")

# Filter by entity type
search_memory_facts(query="coding", entity_types=["Preference", "CodePattern"])

# Use different search recipe
search_with_recipe(query="architecture", recipe="COMBINED_HYBRID_SEARCH_RRF")
```

### Entity Types (for filtering)
- **Emily Custom**: Preference, Decision, Gotcha, Lesson, CodePattern, Context, Relationship, Remember
- **Zep Production**: Location, Event, Organization, Document, Requirement, Procedure, Topic, Object

### Session End
Save a comprehensive summary:
```python
add_memory(
    name="Session summary Dec 18",
    episode_body="Worked on Graphiti fork enhancements. Added search filters, temporal queries, focal entity search, and community building tools. Key decision: Not refactoring to Go (LLM inference is the bottleneck, not Python).",
    group_id="emily"
)
```

## Group IDs
- `emily` - Emily's private memories (Claude Code, Discord)
- `coder` - emily-coder agent memories
- `<bip39-hash>` - Discord user memories

## Upstream Sync

This fork tracks upstream. To pull updates:
```bash
cd C:/Emily/emily-forks/graphiti-mcp-fork
git fetch upstream
git merge upstream/main
# Resolve conflicts if any
git push origin main
```

## Docker Build

The fork builds via docker-compose in `~/.docker/emily-core/`:
```yaml
graphiti-mcp:
  build:
    context: C:/Emily/emily-forks/graphiti-mcp-fork/mcp_server
    dockerfile: docker/Dockerfile
```

To rebuild after changes:
```bash
cd ~/.docker/emily-core
docker compose build graphiti-mcp
docker compose up -d graphiti-mcp
```

## See Also
- [Upstream README](README.md) - Full Graphiti documentation
- [MCP Server README](mcp_server/README.md) - MCP server details
- [arXiv Paper](https://arxiv.org/abs/2501.13956) - Temporal KG architecture
