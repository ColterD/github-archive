# CI/CD Optimization Strategies

Comprehensive guide to optimizing CI/CD for Emily Sovereign V4 using Forgejo Actions.

## CI/CD Architecture

### Forgejo Actions Setup
```yaml
# phase0_nixos_setup/scripts/forgejo_ci_example.yml
name: Sovereign CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: self-hosted
    steps:
      - name: Setup Nix
        run: |
          nix-channel add https://nixos.org/channels/nixos-unstable
          nix-channel update

      - name: Checkout
        uses: actions/checkout@v3

      - name: Build with Nix
        run: |
          nix build .#package

      - name: Run Tests
        run: |
          nix develop .#package --command pytest tests/

      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: result/
```

## Caching Strategies

### Nix Binary Cache
```yaml
# Phase 0: Binary caching setup
jobs:
  build:
    runs-on: self-hosted
    steps:
      - name: Configure Nix cache
        run: |
          # Use public cache
          echo "experimental-features = nix-command" >> /etc/nix/nix.conf
          echo "substituters = https://cache.nixos.org https://nix-community.cachix.org" >> /etc/nix/nix.conf

      - name: Build with caching
        run: |
          nix build .#package --fallback
```

### Docker BuildKit Caching
```yaml
# Phase 0: Docker caching
jobs:
  build:
    runs-on: self-hosted
    steps:
      - name: Set up Docker BuildKit
        run: |
          echo '{"max-parallelism": 4}' | sudo tee /etc/docker/daemon.json
          sudo systemctl restart docker

      - name: Build with BuildKit
        run: |
          DOCKER_BUILDKIT=1 docker build \
            --cache-from type=local,src=/tmp/.buildx-cache \
            --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
            -t sovereign-app .
```

### Caching Impact
| Operation | Without Cache | With Cache | Improvement |
|-----------|--------------|------------|-------------|
| **Nix Build** | 10-20 min | <1 min | 10-20x faster |
| **Docker Build** | 5-10 min | <1 min | 5-10x faster |
| **Dependency Download** | 5-10 min | <1 min | 5-10x faster |

## Parallel Execution

### Job Parallelization
```yaml
# Parallel test execution
jobs:
  test-unit:
    runs-on: self-hosted
    steps:
      - name: Run unit tests
        run: nix develop --command pytest tests/unit/

  test-integration:
    runs-on: self-hosted
    steps:
      - name: Run integration tests
        run: nix develop --command pytest tests/integration/

  test-e2e:
    runs-on: self-hosted
    steps:
      - name: Run E2E tests
        run: nix develop --command pytest tests/e2e/

  # Run all tests in parallel
  all-tests:
    needs: [test-unit, test-integration, test-e2e]
    runs-on: self-hosted
    steps:
      - name: All tests passed
        run: echo "All test suites passed!"
```

### Parallel Test Execution
| Strategy | Time | Resources |
|----------|------|-----------|
| **Sequential** | 30 min | 1 runner |
| **Parallel (3 jobs)** | 10 min | 3 runners | 3x faster |

## Test Optimization

### Pytest Parallel Execution
```bash
# phase0_nixos_setup/scripts/run_tests.sh
# Run tests in parallel with pytest-xdist
pytest -n auto \
  --cov=sovereign \
  --cov-report=xml \
  tests/
```

### Test Caching
```yaml
- name: Cache pytest
  uses: actions/cache@v3
  with:
    path: .pytest_cache
    key: ${{ runner.os }}-pytest-${{ hashFiles('**/requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pytest-
```

### Hypothesis Strategy
```bash
# Run Hypothesis with limited examples
pytest --hypothesis-max-examples=1000 \
  --hypothesis-seed=12345 \
  tests/

# Faster iterations for CI
pytest --hypothesis-suppress-health-check \
  tests/
```

## Deployment Optimization

### Blue-Green Deployment
```yaml
# Blue-Green deployment strategy
deploy:
  needs: build
  runs-on: self-hosted
  strategy:
    matrix:
      environment: [blue, green]

  steps:
      - name: Deploy ${{ matrix.environment }}
        run: |
          # Deploy to environment
          nix-env switch --upgrade \
            --profile deployment \
            --environment ${{ matrix.environment }} \
            result

      - name: Health check ${{ matrix.environment }}
        run: |
          # Wait for health check
          for i in {1..30}; do
            curl -f http://${{ matrix.environment }}.sovereign.local/health || continue
            echo "Health check passed"
            break
          done

  switch-traffic:
    needs: [deploy]
    runs-on: self-hosted
    steps:
      - name: Switch traffic to green
        run: |
          # Update load balancer
          sed -i 's/blue/green/g' /etc/nginx/conf.d/sovereign.conf
          nginx -s reload
```

### Canary Deployment (Alternative)
```yaml
# Canary deployment (gradual rollout)
deploy-canary:
  needs: build
  runs-on: self-hosted
  steps:
      - name: Deploy canary (10% traffic)
        run: |
          # Deploy new version
          nix-env switch --upgrade --profile canary

      - name: Monitor canary
        run: |
          # Monitor metrics for 15 minutes
          for i in {1..15}; do
            # Check error rate
            ERROR_RATE=$(curl -s http://canary/metrics | jq '.error_rate')
            if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
              echo "Error rate too high, rolling back"
              nix-env switch --rollback
              exit 1
            fi
            sleep 60
          done
```

## Resource Optimization

### Runner Caching
```yaml
jobs:
  build:
    runs-on: self-hosted
    env:
      CACHE_VERSION: v1

    steps:
      - name: Cache Nix store
        uses: actions/cache@v3
        with:
          path: /nix/store
          key: ${{ runner.os }}-nix-${{ env.CACHE_VERSION }}-${{ hashFiles('flake.nix') }}
```

### Self-Hosted Runner Optimization
```nix
# Phase 0: Runner configuration
services.forgejo-runner = {
  enable = true;
  settings = {
    # Runner limits
    max_concurrent = 4;
    cache_timeout = 3600;
    timeout = 7200;

    # Resource limits
    resource_class = "large";  # 8 CPU, 32GB RAM

    # Caching
    caching_enabled = true;
    cache_dir = "/var/lib/forgejo-runner/cache";
  };
};
```

## Artifact Management

### Artifact Upload Strategy
```yaml
jobs:
  build:
    runs-on: self-hosted
    steps:
      - name: Build
        run: nix build .#package

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-${{ github.sha }}
          path: result/
          retention-days: 7  # Keep for 7 days

      - name: Create release
        if: github.ref == 'refs/heads/main'
        uses: actions/create-release@v1
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          draft: false
```

### Artifact Compression
```bash
# Compress artifacts before upload
tar -czf build-${GITHUB_SHA}.tar.gz result/

# Upload compressed artifact (smaller, faster)
```

## Monitoring CI/CD

### Forgejo Metrics
```yaml
# Prometheus scrape config for Forgejo
scrape_configs:
  - job_name: 'forgejo'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### Key CI/CD Metrics
- **forgejo_job_duration_seconds**: Job execution time
- **forgejo_queue_duration_seconds**: Queue wait time
- **forgejo_runner_busy_seconds**: Runner busy time
- **forgejo_actions_runner_concurrency**: Concurrent jobs

## Troubleshooting

### 1. Slow Pipeline
```yaml
# Add timing annotations
- name: Annotate start time
  run: |
    echo "::notice::Build started at $(date)"

- name: Build
  run: |
    time nix build .#package

- name: Annotate end time
  if: always()
  run: |
    echo "::notice::Build completed at $(date)"
```

### 2. Flaky Tests
```yaml
# Retry failed tests
- name: Run tests with retry
  uses: nick-fields/retry-action@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    retry_on: error
    command: |
      pytest --maxfail=1 tests/
```

### 3. Cache Miss
```yaml
# Debug cache misses
- name: Cache debug
  run: |
    if [ "${{ steps.cache.outputs.cache-hit }}" != "true" ]; then
      echo "Cache miss for key: ${{ steps.cache.outputs.cache-key }}"
    fi
```

## Performance Benchmarks

### Expected CI/CD Performance
| Metric | Without Optimization | With Optimization | Improvement |
|--------|---------------------|-------------------|-------------|
| **Full Pipeline** | 30-45 min | 10-15 min | 3x faster |
| **Nix Build** | 15-20 min | <1 min | 15-20x faster |
| **Test Execution** | 10 min | 3 min (parallel) | 3x faster |
| **Deployment Time** | 5-10 min | <1 min | 5-10x faster |

## Best Practices

### 1. Cache Everything
```yaml
# Cache Nix, Docker, pytest, pip
- name: Cache Nix
  uses: actions/cache@v3
  with:
    path: /nix/store

- name: Cache Docker
  uses: actions/cache@v3
  with:
    path: /var/lib/docker

- name: Cache Python
  uses: actions/cache@v3
  with:
    path: ~/.cache/pip
```

### 2. Parallelize Jobs
```yaml
# Run independent jobs in parallel
jobs:
  lint:
    # Run in parallel with tests
    runs-on: self-hosted
    steps: [run-linter]

  test:
    runs-on: self-hosted
    steps: [run-tests]
```

### 3. Fail Fast
```yaml
# Cancel in-progress jobs on failure
concurrency:
  group: ci-pipeline
  cancel-in-progress: true
```

### 4. Use Matrix for Variants
```yaml
# Test multiple configurations
strategy:
  matrix:
    python-version: ["3.10", "3.11", "3.12"]
    postgres-version: ["14", "15", "16"]
```

---

**Last Updated**: 2026-01-12

**For AI Agents**: When optimizing CI/CD:
1. Cache at every level (Nix, Docker, dependencies)
2. Parallelize independent jobs
3. Use blue-green or canary deployments
4. Monitor pipeline metrics
5. Fail fast (cancel jobs on failure)
