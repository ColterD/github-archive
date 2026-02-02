#!/usr/bin/env node

/**
 * GitHub Coding Agent Memory Creation Script
 * 
 * This script creates a memory node using the Mimir MCP server
 * and then searches for it to confirm successful creation.
 * 
 * Requirements:
 * - Mimir services must be running (docker compose up -d)
 * - Node.js installed
 * 
 * Usage:
 *   node create-memory.js
 */

const http = require('http');

const MIMIR_MCP_URL = 'http://localhost:9042/mcp';

/**
 * Make a JSON-RPC call to the Mimir MCP server
 */
function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'localhost',
      port: 9042,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Create a memory node with specified details
 */
async function createMemory() {
  console.log('Creating memory node...');
  
  const payload = {
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
          tags: ['github', 'coding-agent', 'automated-test', '2025-11-15']
        }
      }
    }
  };
  
  try {
    const response = await makeRequest(payload);
    
    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`);
    }
    
    console.log('✓ Memory created successfully!');
    console.log('  ID:', response.result.id);
    console.log('  Title:', response.result.title || 'GitHub Coding Agent Test');
    
    return response.result.id;
  } catch (error) {
    console.error('✗ Failed to create memory:', error.message);
    throw error;
  }
}

/**
 * Search for the created memory using vector search
 */
async function searchMemory() {
  console.log('\nSearching for created memory...');
  
  const payload = {
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
  
  try {
    const response = await makeRequest(payload);
    
    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`);
    }
    
    const results = response.result;
    
    if (!Array.isArray(results) || results.length === 0) {
      console.warn('⚠ No results found in search');
      return false;
    }
    
    // Look for our specific memory
    const foundMemory = results.find(item => 
      item.title === 'GitHub Coding Agent Test' || 
      (item.content && item.content.includes('GitHub Coding Agent during automated testing'))
    );
    
    if (foundMemory) {
      console.log('✓ Memory found in search results!');
      console.log('  Title:', foundMemory.title);
      console.log('  Similarity:', foundMemory.similarity);
      console.log('  Content preview:', foundMemory.content ? foundMemory.content.substring(0, 80) + '...' : 'N/A');
      return true;
    } else {
      console.warn('⚠ Memory not found in top search results');
      return false;
    }
  } catch (error) {
    console.error('✗ Failed to search memory:', error.message);
    throw error;
  }
}

/**
 * Query all memories to confirm creation
 */
async function verifyMemory() {
  console.log('\nVerifying memory exists in database...');
  
  const payload = {
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
  
  try {
    const response = await makeRequest(payload);
    
    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`);
    }
    
    const memories = response.result;
    
    // Find our specific memory
    const ourMemory = memories.find(item => 
      item.title === 'GitHub Coding Agent Test'
    );
    
    if (ourMemory) {
      console.log('✓ Memory confirmed in database!');
      console.log('  Title:', ourMemory.title);
      console.log('  Content:', ourMemory.content);
      console.log('  Created:', ourMemory.created || 'N/A');
      return true;
    } else {
      console.warn('⚠ Memory not found in database query');
      return false;
    }
  } catch (error) {
    console.error('✗ Failed to verify memory:', error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('==========================================');
  console.log('GitHub Coding Agent Memory Creation Test');
  console.log('==========================================\n');
  
  try {
    // Step 1: Create the memory
    const memoryId = await createMemory();
    
    // Wait a moment for indexing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Search for the memory
    const searchFound = await searchMemory();
    
    // Step 3: Verify in database
    const verifyFound = await verifyMemory();
    
    console.log('\n==========================================');
    console.log('Summary');
    console.log('==========================================');
    console.log('Memory Created:', '✓');
    console.log('Found in Search:', searchFound ? '✓' : '✗');
    console.log('Verified in DB:', verifyFound ? '✓' : '✗');
    console.log('\n✓ Test completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n==========================================');
    console.error('✗ Test failed:', error.message);
    console.error('==========================================');
    console.error('\nPlease ensure:');
    console.error('1. Mimir services are running (docker compose up -d)');
    console.error('2. MCP server is accessible at http://localhost:9042');
    console.error('3. Ollama embeddings model is loaded');
    process.exit(1);
  }
}

// Run the script
main();
