import { test, expect } from '@playwright/test';

/**
 * Health Check Tests for Mimir AI Orchestration Stack
 * Tests all service endpoints are responsive
 */

test.describe('Service Health Checks', () => {
  
  test('Neo4j Browser is accessible', async ({ page }) => {
    await page.goto('http://localhost:7474');
    
    // Wait for Neo4j Browser UI to load
    await expect(page).toHaveTitle(/Neo4j Browser/i);
    
    // Check for login form
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
  
  test('Mimir MCP health endpoint responds', async ({ request }) => {
    const response = await request.get('http://localhost:9042/health');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('healthy');
  });
  
  test('Ollama API is responsive', async ({ request }) => {
    const response = await request.get('http://localhost:11434/api/tags');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('models');
    expect(Array.isArray(body.models)).toBe(true);
  });
  
});

test.describe('Neo4j Authentication', () => {
  
  test('Can login to Neo4j Browser', async ({ page }) => {
    await page.goto('http://localhost:7474');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[name="username"]', 'neo4j');
    await page.fill('input[name="password"]', 'password');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for successful login (dashboard or query interface)
    await expect(page.locator('[data-testid="main"]')).toBeVisible({ timeout: 15000 });
  });
  
});
