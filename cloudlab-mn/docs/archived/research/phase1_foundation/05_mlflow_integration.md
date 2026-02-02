# MLflow Integration: Experiment Tracking with LLM Evaluation

**Component**: Phase 1.5 - MLflow
**Duration**: Week 4 (12 hours)
**Priority**: P1 - Critical for experiment reproducibility
**Platform**: CloudLab c220g5

---

## MLflow 2.18+ Features

- LLM evaluation (mlflow.evaluate())
- Prompt Engineering UI
- Gateway/Proxy for API key management
- Recipes for AutoML

## Installation

See example_configurations/mlflow_config.yaml for Docker Compose deployment.

## LLM Evaluation

```python
import mlflow
from crewai import Crew

# Evaluate CrewAI performance
with mlflow.start_run() as run:
    result = crew.kickoff(stimulus)
    
    mlflow.evaluate(
        result,
        model_type="question-answering",
        evaluators=[factual_consistency, safety_check]
    )
```

---

## Sources

- MLflow: https://mlflow.org/docs/latest/
