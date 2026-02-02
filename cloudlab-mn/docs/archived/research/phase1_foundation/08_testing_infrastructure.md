# Testing Infrastructure: Pytest, Hypothesis, Coverage

**Component**: Phase 1.8 - Testing
**Duration**: Week 4 (16 hours)
**Priority**: P1 - Critical for code quality
**Platform**: CloudLab c220g5

---

## Test Pyramid

| Layer | Tool | Coverage Target |
|-------|-------|-----------------|
| **Unit Tests** | Pytest | >70% |
| **Property Tests** | Hypothesis | Core algorithms |
| **Integration Tests** | Pytest | Cross-tier communication |
| **E2E Tests** | Pytest | Full Triune loop |

## Property-Based Testing

```python
from hypothesis import given, strategies
import numpy as np

@given(
    dopamine=strategies.floats(min_value=-1, max_value=1),
    serotonin=strategies.floats(min_value=-1, max_value=1)
)
def test_allostatic_regulation(dopamine, serotonin):
    """Test opponent-process behavior"""
    # High dopamine should trigger norepinephrine rebound
    if dopamine > 0.8:
        # Apply crash
        assert dopamine < 0.5, "Dopamine crash occurred"
```

---

## Sources

- Pytest: https://docs.pytest.org/
- Hypothesis: https://hypothesis.readthedocs.io/
