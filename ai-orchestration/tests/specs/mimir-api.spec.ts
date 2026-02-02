import { test, expect } from '@playwright/test';

/**
 * Mimir MCP API Tests
 * Tests memory operations via MCP endpoints
 */

test.describe('Mimir MCP API', () => {
  
  test('Can call memory_node query operation', async ({ request }) => {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'mcp_mimir_memory_node',
        arguments: {
          operation: 'query',
          type: 'memory',
          filters: {}
        }
      }
    };
    
    const response = await request.post('http://localhost:9042/mcp', {
      data: payload
    });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('result');
    expect(Array.isArray(body.result)).toBe(true);
  });
  
  test('Can add and retrieve memory', async ({ request }) => {
    // Add memory
    const addPayload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'mcp_mimir_memory_node',
        arguments: {
          operation: 'add',
          type: 'memory',
          properties: {
            title: 'Playwright Test Memory',
            content: 'This is a test memory created by Playwright automation',
            category: 'test',
            tags: ['playwright', 'automation', 'test']
          }
        }
      }
    };
    
    const addResponse = await request.post('http://localhost:9042/mcp', {
      data: addPayload
    });
    
    expect(addResponse.status()).toBe(200);
    
    const addBody = await addResponse.json();
    expect(addBody).toHaveProperty('result');
    expect(addBody.result).toHaveProperty('id');
    
    const memoryId = addBody.result.id;
    
    // Retrieve memory
    const getPayload = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'mcp_mimir_memory_node',
        arguments: {
          operation: 'get',
          id: memoryId
        }
      }
    };
    
    const getResponse = await request.post('http://localhost:9042/mcp', {
      data: getPayload
    });
    
    expect(getResponse.status()).toBe(200);
    
    const getBody = await getResponse.json();
    expect(getBody.result).toHaveProperty('title', 'Playwright Test Memory');
    expect(getBody.result).toHaveProperty('content');
    expect(getBody.result.content).toContain('Playwright automation');
  });
  
  test('Vector search returns relevant results', async ({ request }) => {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'mcp_mimir_vector_search_nodes',
        arguments: {
          query: 'testing automation',
          limit: 5,
          min_similarity: 0.3
        }
      }
    };
    
    const response = await request.post('http://localhost:9042/mcp', {
      data: payload
    });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('result');
    expect(Array.isArray(body.result)).toBe(true);
    
    // Each result should have similarity score
    if (body.result.length > 0) {
      expect(body.result[0]).toHaveProperty('similarity');
      expect(typeof body.result[0].similarity).toBe('number');
      expect(body.result[0].similarity).toBeGreaterThanOrEqual(0);
      expect(body.result[0].similarity).toBeLessThanOrEqual(1);
    }
  });
  
});
