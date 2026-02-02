# Playwright Test Suite for Mimir AI Orchestration

**Created**: November 13, 2025  
**Purpose**: Browser automation and API testing for Mimir stack

## Overview
Playwright-based test suite for comprehensive testing of:
- Service health checks (Neo4j, Mimir MCP, Ollama)
- Neo4j Browser UI functionality
- Mimir MCP API operations
- Memory CRUD operations
- Vector search functionality

## Setup

### Prerequisites
- Docker running with Mimir stack
- All services healthy (Neo4j, Mimir MCP, Ollama)

### Installation (In Container)
```bash
# Start Playwright container
docker-compose up -d playwright

# Install dependencies
docker exec -it mimir_playwright sh
cd /tests
npm install
```

### Installation (Local - Optional)
```bash
cd tests
npm install
npx playwright install
```

## Running Tests

### Via Docker (Recommended for Agent Use)
```bash
# Run all tests
docker exec -it mimir_playwright npx playwright test

# Run specific test file
docker exec -it mimir_playwright npx playwright test specs/health.spec.ts

# Run in headed mode (with browser UI)
docker exec -it mimir_playwright npx playwright test --headed

# Debug mode
docker exec -it mimir_playwright npx playwright test --debug

# Generate code
docker exec -it mimir_playwright npx playwright codegen http://localhost:7474
```

### Via m.ps1 CLI Integration
```powershell
# Run all tests
.\m.ps1 test-browser

# Run specific test
.\m.ps1 test-browser health

# Run with options
.\m.ps1 test-browser --headed --debug
```

## Test Suites

### 1. Health Checks (`specs/health.spec.ts`)
Tests all service endpoints are responsive.

**Tests:**
- Neo4j Browser accessibility
- Mimir MCP health endpoint
- Ollama API responsiveness
- Neo4j authentication

**Expected Results:**
- All services return 200 status
- Neo4j Browser UI loads
- Health endpoints return "healthy" status

### 2. Mimir API Tests (`specs/mimir-api.spec.ts`)
Tests memory operations via MCP endpoints.

**Tests:**
- Query memory nodes
- Add and retrieve memory
- Vector search functionality

**Expected Results:**
- Memory CRUD operations succeed
- Vector search returns relevant results with similarity scores
- All API responses follow JSON-RPC 2.0 format

## Test Configuration

### Browser Coverage
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

### Reporters
- HTML report: `test-results/html/index.html`
- JSON report: `test-results/results.json`
- JUnit XML: `test-results/junit.xml` (for CI/CD)

### Timeouts
- Test timeout: 30 seconds
- Service startup: 120 seconds
- Retry on CI: 2 attempts

## Directory Structure
```
tests/
├── package.json              # Dependencies
├── playwright.config.ts      # Playwright configuration
├── specs/                    # Test specifications
│   ├── health.spec.ts       # Health check tests
│   └── mimir-api.spec.ts    # MCP API tests
└── README.md                # This file

test-results/                 # Test output (created automatically)
├── html/                     # HTML test report
├── results.json              # JSON results
├── junit.xml                 # JUnit XML (for CI/CD)
├── screenshots/              # Failure screenshots
└── videos/                   # Test recordings
```

## Writing New Tests

### Basic Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  
  test('should do something', async ({ page }) => {
    await page.goto('http://localhost:7474');
    await expect(page).toHaveTitle(/Expected/);
  });
  
  test('API call test', async ({ request }) => {
    const response = await request.post('http://localhost:9042/mcp', {
      data: { /* payload */ }
    });
    expect(response.status()).toBe(200);
  });
  
});
```

### Best Practices
- Use descriptive test names
- Group related tests in `describe` blocks
- Use `page.waitForLoadState('networkidle')` for stability
- Add timeout for slow operations
- Clean up test data in `afterEach` hooks
- Use data-testid attributes for selectors

## Debugging

### View Test Report
```bash
# After running tests
npx playwright show-report ../test-results/html
```

### Debug Failed Tests
```bash
# Run only failed tests
npx playwright test --last-failed

# Trace viewer for failures
npx playwright show-trace ../test-results/trace.zip
```

### Screenshot on Failure
Screenshots automatically saved to `test-results/screenshots/`

### Video Recording
Videos saved for failed tests in `test-results/videos/`

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Playwright tests
  run: |
    docker-compose up -d
    docker exec mimir_playwright npx playwright test
    
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-results
    path: test-results/
```

## Troubleshooting

### Services Not Ready
```bash
# Check service health
.\m.ps1 health

# Wait for all services
docker-compose up -d && sleep 30
```

### Container Issues
```bash
# Restart Playwright container
docker-compose restart playwright

# View logs
docker logs mimir_playwright
```

### Test Failures
- Verify services are running: `.\m.ps1 status`
- Check Neo4j credentials (neo4j/password)
- Ensure ports are accessible (7474, 9042, 11434)
- Review test output for specific errors

## Future Enhancements

- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Mobile browser testing
- [ ] Accessibility (a11y) testing
- [ ] Load testing scenarios
- [ ] Integration with Grafana for metrics
