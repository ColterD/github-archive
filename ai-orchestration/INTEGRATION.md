# Integration Guide for Using Mimir from Other Projects

This guide explains how other projects in your workspace can access and use the Mimir memory/RAG system.

## Overview

The Mimir stack running in `AI_Orchestration` provides a centralized memory system that all your projects can access via:

1. **HTTP API** - Direct REST API calls to the MCP server
2. **MCP Protocol** - Model Context Protocol for AI agents
3. **Neo4j Direct** - Direct database queries (advanced)

## Quick Access

### From GitHub Copilot

GitHub Copilot can automatically use Mimir's MCP tools when the server is running:

```
MCP Server URL: http://localhost:9042
```

The following MCP tools are available:
- `memory_node` - Store/retrieve memories
- `vector_search_nodes` - Semantic search
- `index_folder` - Index project files
- `todo` - Task management
- And more...

### From Your Code

#### PowerShell Example

```powershell
# Create a memory
$body = @{
    jsonrpc = "2.0"
    method = "tools/call"
    params = @{
        name = "memory_node"
        arguments = @{
            operation = "add"
            type = "memory"
            properties = @{
                title = "Important Decision"
                content = "We decided to use React for the frontend"
                project = "MyApp"
            }
        }
    }
    id = 1
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:9042/mcp" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

#### JavaScript/TypeScript Example

```javascript
// Search for relevant memories
async function searchMemories(query) {
    const response = await fetch('http://localhost:9042/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: 'vector_search_nodes',
                arguments: {
                    query: query,
                    limit: 5,
                    types: ['memory', 'file']
                }
            },
            id: 1
        })
    });
    
    return await response.json();
}

// Usage
const results = await searchMemories('authentication code');
console.log(results);
```

#### Python Example

```python
import requests

def create_todo(title, description):
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "todo",
            "arguments": {
                "operation": "create",
                "title": title,
                "description": description,
                "priority": "high"
            }
        },
        "id": 1
    }
    
    response = requests.post(
        'http://localhost:9042/mcp',
        json=payload
    )
    
    return response.json()

# Usage
result = create_todo(
    "Implement login feature",
    "Add JWT authentication to the API"
)
print(result)
```

#### C# Example

```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;

public class MimirClient
{
    private readonly HttpClient _httpClient;
    private const string MimirUrl = "http://localhost:9042/mcp";
    
    public MimirClient()
    {
        _httpClient = new HttpClient();
    }
    
    public async Task<JsonDocument> SearchAsync(string query)
    {
        var payload = new
        {
            jsonrpc = "2.0",
            method = "tools/call",
            @params = new
            {
                name = "vector_search_nodes",
                arguments = new
                {
                    query = query,
                    limit = 5
                }
            },
            id = 1
        };
        
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );
        
        var response = await _httpClient.PostAsync(MimirUrl, content);
        var json = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(json);
    }
}

// Usage
var client = new MimirClient();
var results = await client.SearchAsync("database connection");
```

## Project-Specific Patterns

### Tagging Memories by Project

Always tag memories with your project name for better organization:

```json
{
    "operation": "add",
    "type": "memory",
    "properties": {
        "title": "Design Decision",
        "content": "Using PostgreSQL for data storage",
        "project": "7Days",
        "category": "database"
    }
}
```

### Querying Project-Specific Memories

Filter by project when searching:

```json
{
    "operation": "query",
    "type": "memory",
    "filters": {
        "project": "7Days"
    }
}
```

### Cross-Project References

Link related items across projects:

```json
{
    "operation": "add",
    "source": "memory-123",  // From project A
    "target": "memory-456",  // From project B
    "type": "relates_to",
    "properties": {
        "reason": "Uses same authentication pattern"
    }
}
```

## Indexing Your Project Files

To enable semantic search across your project:

```powershell
# From AI_Orchestration directory
cd mimir
npm install  # First time only

# Index your project (use absolute path)
npm run index:add C:\Users\Colter\Desktop\Projects\Github\7Days

# Or use the management script
cd ..
.\mimir-manage.ps1 index C:\Users\Colter\Desktop\Projects\Github\7Days
```

Once indexed, AI agents can:
- Search for code snippets semantically
- Find related files
- Understand code relationships
- Answer questions about your codebase

## Best Practices

### 1. Consistent Naming

Use consistent project names across all memories:

```javascript
const PROJECT_NAME = "7Days";

// Always use the same project identifier
createMemory({
    project: PROJECT_NAME,
    // ...
});
```

### 2. Structured Memory Types

Define types for different memory categories:

```javascript
const MemoryTypes = {
    DECISION: 'decision',
    BUG_FIX: 'bug_fix',
    FEATURE: 'feature',
    NOTE: 'note'
};

createMemory({
    type: 'memory',
    properties: {
        memoryType: MemoryTypes.DECISION,
        project: PROJECT_NAME,
        // ...
    }
});
```

### 3. Rich Context

Include relevant context in memories:

```javascript
createMemory({
    title: "Switched to Vite",
    content: "Migrated from Webpack to Vite for faster builds",
    project: "7Days",
    files: ["vite.config.js", "package.json"],
    author: "developer@example.com",
    date: new Date().toISOString(),
    tags: ["build", "tooling", "performance"]
});
```

### 4. Semantic Search First

Use semantic search instead of exact queries:

```javascript
// ❌ Less effective
searchMemories("webpack vite migration");

// ✅ Better - describes what you need
searchMemories("how did we switch build tools for better performance");
```

## Helper Libraries

### Create a Wrapper Class

```javascript
// mimir-client.js
class MimirClient {
    constructor(projectName) {
        this.projectName = projectName;
        this.baseUrl = 'http://localhost:9042/mcp';
    }
    
    async createMemory({ title, content, tags = [] }) {
        return this._call('memory_node', {
            operation: 'add',
            type: 'memory',
            properties: {
                title,
                content,
                project: this.projectName,
                tags,
                timestamp: new Date().toISOString()
            }
        });
    }
    
    async search(query, limit = 5) {
        return this._call('vector_search_nodes', {
            query,
            limit,
            types: ['memory', 'file']
        });
    }
    
    async createTodo({ title, description, priority = 'medium' }) {
        return this._call('todo', {
            operation: 'create',
            title,
            description,
            priority,
            properties: {
                project: this.projectName
            }
        });
    }
    
    async _call(toolName, args) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args
                },
                id: Date.now()
            })
        });
        
        return await response.json();
    }
}

// Usage
const mimir = new MimirClient('7Days');
await mimir.createMemory({
    title: 'API Endpoint Added',
    content: 'Created /api/users endpoint with pagination',
    tags: ['api', 'backend']
});
```

## Troubleshooting

### Connection Refused

If you get connection errors:

```powershell
# Check if Mimir is running
docker compose ps

# Start services if needed
cd C:\Users\Colter\Desktop\Projects\AI_Orchestration
.\mimir-manage.ps1 start
```

### Can't Find Indexed Files

```powershell
# Check what's indexed
cd AI_Orchestration\mimir
npm run index:list

# Re-index if needed
npm run index:add C:\Path\To\Your\Project
```

### Slow Semantic Search

Semantic search requires embeddings. Ensure:

1. Ollama is running: `docker compose ps ollama`
2. Model is downloaded: `docker exec mimir_ollama ollama list`
3. Embeddings are enabled in `.env`: `MIMIR_EMBEDDINGS_ENABLED=true`

## Example Integration

See the `examples/` directory (to be created) for complete integration examples:

- `examples/7Days-integration/` - 7DTD mod integration example
- `examples/web-app/` - React/TypeScript web app example
- `examples/python-script/` - Python automation example

## API Reference

For complete API documentation, see:
- [Mimir Documentation](https://github.com/orneryd/Mimir/tree/main/docs)
- [MCP Protocol Spec](https://modelcontextprotocol.io/)

## Need Help?

1. Check service status: `.\mimir-manage.ps1 status`
2. View logs: `.\mimir-manage.ps1 logs -Follow`
3. Test health: `.\mimir-manage.ps1 health`
4. Read README.md for troubleshooting
