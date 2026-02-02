# Configuration Guide for AI Tools

This guide shows how to configure various AI tools and IDEs to use the Mimir MCP server.

## VS Code with GitHub Copilot

### Enable MCP in VS Code

1. **Install GitHub Copilot extension** (if not already installed)

2. **No additional configuration needed!** 
   - GitHub Copilot in VS Code can automatically discover and use MCP servers running on localhost
   - The MCP server at `http://localhost:9042` will be available to Copilot

3. **Test it:**
   - Open any file in VS Code
   - Ask Copilot: "Create a TODO in Mimir for implementing user authentication"
   - Copilot should use the `todo` tool from Mimir

### Manual MCP Configuration (if needed)

If auto-discovery doesn't work, you can configure it manually:

1. Open VS Code Settings (Ctrl+,)
2. Search for "MCP"
3. Add MCP server configuration:
   ```json
   {
       "mcp.servers": [
           {
               "name": "Mimir",
               "url": "http://localhost:9042",
               "description": "AI Memory and RAG System"
           }
       ]
   }
   ```

## Claude Desktop App

### Configuration File Location

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Configuration

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mimir": {
      "command": "node",
      "args": [],
      "env": {},
      "url": "http://localhost:9042",
      "transport": "http"
    }
  }
}
```

Or use stdio transport (if you prefer):

```json
{
  "mcpServers": {
    "mimir": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "mimir_mcp_server",
        "node",
        "/app/dist/index.js"
      ]
    }
  }
}
```

### Verify Connection

1. Restart Claude Desktop
2. Start a new conversation
3. Type: "What MCP tools are available?"
4. Claude should list Mimir tools

## Cursor IDE

### Enable MCP

1. Open Cursor Settings
2. Navigate to Features → Model Context Protocol
3. Enable MCP support

### Add Mimir Server

Create/edit `~/.cursor/mcp.json`:

```json
{
  "servers": {
    "mimir": {
      "url": "http://localhost:9042",
      "name": "Mimir Memory System",
      "description": "Persistent memory and semantic search"
    }
  }
}
```

### Alternative: Environment Variables

Add to your shell profile:

```bash
export MCP_SERVER_MIMIR_URL=http://localhost:9042
```

## Continue.dev Extension

### Configuration

Edit `.continue/config.json` in your project:

```json
{
  "models": [...],
  "mcpServers": [
    {
      "name": "mimir",
      "url": "http://localhost:9042",
      "tools": [
        "memory_node",
        "vector_search_nodes",
        "todo",
        "index_folder"
      ]
    }
  ]
}
```

## Custom MCP Client

### JavaScript/TypeScript

```typescript
// mcp-client.ts
import { createMCPClient } from '@modelcontextprotocol/sdk';

const client = createMCPClient({
    url: 'http://localhost:9042',
    transport: 'http'
});

// Initialize connection
await client.connect();

// Call a tool
const result = await client.callTool('memory_node', {
    operation: 'add',
    type: 'memory',
    properties: {
        title: 'Test Memory',
        content: 'This is a test'
    }
});

console.log(result);
```

### Python

```python
from mcp import MCPClient

# Create client
client = MCPClient('http://localhost:9042')

# Call a tool
result = client.call_tool('vector_search_nodes', {
    'query': 'authentication code',
    'limit': 5
})

print(result)
```

## Environment Variables

For tools that support environment-based MCP configuration:

### Windows (PowerShell)

```powershell
# Add to your PowerShell profile
$env:MCP_SERVER_MIMIR = "http://localhost:9042"
$env:MIMIR_ENABLED = "true"
```

### Windows (Permanent)

```powershell
# Set system environment variable
[System.Environment]::SetEnvironmentVariable('MCP_SERVER_MIMIR', 'http://localhost:9042', 'User')
```

### macOS/Linux (Bash)

```bash
# Add to ~/.bashrc or ~/.zshrc
export MCP_SERVER_MIMIR=http://localhost:9042
export MIMIR_ENABLED=true
```

## Docker Compose Integration

For other Docker projects that need to access Mimir:

```yaml
# In your project's docker-compose.yml
version: '3.8'

services:
  your-service:
    image: your-image
    environment:
      - MIMIR_MCP_URL=http://host.docker.internal:9042
      - NEO4J_URL=http://host.docker.internal:7474
    extra_hosts:
      - "host.docker.internal:host-gateway"
    # Or connect to the same network
    networks:
      - mimir_network

networks:
  mimir_network:
    external: true
    name: ai_orchestration_mimir_network
```

## Testing Connection

### PowerShell Test

```powershell
# Test health endpoint
Invoke-WebRequest -Uri http://localhost:9042/health

# Test MCP protocol
$body = @{
    jsonrpc = "2.0"
    method = "initialize"
    params = @{
        protocolVersion = "2024-11-05"
        capabilities = @{}
        clientInfo = @{
            name = "test-client"
            version = "1.0.0"
        }
    }
    id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:9042/mcp `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### cURL Test

```bash
# Health check
curl http://localhost:9042/health

# Initialize MCP session
curl -X POST http://localhost:9042/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    },
    "id": 1
  }'
```

### JavaScript Test

```javascript
// test-mcp.js
async function testMCP() {
    const response = await fetch('http://localhost:9042/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'test', version: '1.0.0' }
            },
            id: 1
        })
    });
    
    const data = await response.json();
    console.log('MCP initialized:', data);
    
    // List available tools
    const toolsResponse = await fetch('http://localhost:9042/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/list',
            params: {},
            id: 2
        })
    });
    
    const tools = await toolsResponse.json();
    console.log('Available tools:', tools);
}

testMCP();
```

## Troubleshooting

### "Connection Refused"

1. Check Mimir is running:
   ```powershell
   docker compose ps
   ```

2. Start services if needed:
   ```powershell
   .\mimir-manage.ps1 start
   ```

3. Check health endpoint:
   ```powershell
   curl http://localhost:9042/health
   ```

### "Tools Not Available"

1. Verify MCP server is healthy:
   ```powershell
   .\mimir-manage.ps1 health
   ```

2. Check logs for errors:
   ```powershell
   docker compose logs mcp-server
   ```

3. Restart MCP server:
   ```powershell
   docker compose restart mcp-server
   ```

### "Neo4j Connection Error"

1. Check Neo4j is running:
   ```powershell
   docker compose ps neo4j
   ```

2. Verify password in `.env` matches Neo4j config

3. Check Neo4j logs:
   ```powershell
   docker compose logs neo4j
   ```

### Port Conflicts

If ports are already in use, edit `docker-compose.yml`:

```yaml
# Change the first port number (host side)
ports:
  - "9043:3000"  # Changed 9042 → 9043
```

Then update your client configuration to use the new port.

## Advanced Configuration

### Custom MCP Server Port

Edit `docker-compose.yml`:

```yaml
mcp-server:
  ports:
    - "YOUR_PORT:3000"
```

Update clients to use `http://localhost:YOUR_PORT`

### Enable CORS (for web clients)

If you need to access Mimir from browser-based tools:

1. Edit `docker-compose.yml`:
   ```yaml
   mcp-server:
     environment:
       - ENABLE_CORS=true
       - CORS_ORIGIN=http://localhost:3000
   ```

2. Restart:
   ```powershell
   docker compose restart mcp-server
   ```

### SSL/TLS Configuration

For production deployments, use a reverse proxy (nginx/traefik) with SSL certificates.

Example nginx config:

```nginx
server {
    listen 443 ssl;
    server_name mimir.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:9042;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Best Practices

1. **Use health checks** before making requests
2. **Handle connection errors** gracefully
3. **Cache MCP session IDs** for better performance
4. **Use semantic search** instead of exact queries
5. **Tag memories** with project names for organization

## Support

For configuration issues:

1. Check the logs: `docker compose logs -f`
2. Verify services: `.\mimir-manage.ps1 status`
3. Test connection: `.\mimir-manage.ps1 health`
4. Read integration docs: `INTEGRATION.md`
5. Review Mimir docs: https://github.com/orneryd/Mimir
