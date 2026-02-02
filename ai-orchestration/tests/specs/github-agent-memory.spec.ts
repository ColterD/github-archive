import { test, expect } from '@playwright/test';

/**
 * GitHub Coding Agent Memory Creation Test
 * Creates a memory node with specific details and verifies it was created successfully
 */

test.describe('GitHub Coding Agent Memory Creation', () => {
  
  let createdMemoryId: string;
  
  test('Create memory node for GitHub Coding Agent test', async ({ request }) => {
    // Create memory with specified details
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
            title: 'GitHub Coding Agent Test',
            content: 'This memory was created by a GitHub Coding Agent during automated testing on 2025-11-15 00:05:26',
            category: 'test',
            tags: ['github', 'coding-agent', 'automated-test']
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
    
    createdMemoryId = addBody.result.id;
    
    console.log(`Created memory with ID: ${createdMemoryId}`);
  });
  
  test('Search for created memory to confirm success', async ({ request }) => {
    // Search for the memory using vector search
    const searchPayload = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'mcp_mimir_vector_search_nodes',
        arguments: {
          query: 'GitHub Coding Agent Test',
          limit: 10,
          min_similarity: 0.3
        }
      }
    };
    
    const searchResponse = await request.post('http://localhost:9042/mcp', {
      data: searchPayload
    });
    
    expect(searchResponse.status()).toBe(200);
    
    const searchBody = await searchResponse.json();
    expect(searchBody).toHaveProperty('result');
    expect(Array.isArray(searchBody.result)).toBe(true);
    
    // Verify we found at least one result
    expect(searchBody.result.length).toBeGreaterThan(0);
    
    // Look for our specific memory in the results
    const foundMemory = searchBody.result.find((item: any) => 
      item.title === 'GitHub Coding Agent Test' || 
      item.content?.includes('GitHub Coding Agent during automated testing')
    );
    
    expect(foundMemory).toBeDefined();
    
    if (foundMemory) {
      console.log(`Found memory: ${foundMemory.title}`);
      console.log(`Similarity score: ${foundMemory.similarity}`);
      expect(foundMemory).toHaveProperty('title', 'GitHub Coding Agent Test');
      expect(foundMemory.content).toContain('2025-11-15 00:05:26');
    }
  });
  
  test('Retrieve memory directly by querying all memories', async ({ request }) => {
    // Query all memories to find ours
    const queryPayload = {
      jsonrpc: '2.0',
      id: 3,
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
    
    const queryResponse = await request.post('http://localhost:9042/mcp', {
      data: queryPayload
    });
    
    expect(queryResponse.status()).toBe(200);
    
    const queryBody = await queryResponse.json();
    expect(queryBody).toHaveProperty('result');
    expect(Array.isArray(queryBody.result)).toBe(true);
    
    // Find our specific memory
    const ourMemory = queryBody.result.find((item: any) => 
      item.title === 'GitHub Coding Agent Test'
    );
    
    expect(ourMemory).toBeDefined();
    
    if (ourMemory) {
      console.log(`Confirmed memory exists in database:`);
      console.log(`  Title: ${ourMemory.title}`);
      console.log(`  Content: ${ourMemory.content}`);
      expect(ourMemory.content).toContain('This memory was created by a GitHub Coding Agent');
      expect(ourMemory.content).toContain('2025-11-15 00:05:26');
    }
  });
  
});
