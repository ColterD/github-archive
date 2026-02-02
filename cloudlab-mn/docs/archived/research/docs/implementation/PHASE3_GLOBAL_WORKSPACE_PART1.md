# Phase 3: Global Workspace Implementation Guide

**Component**: Tier 2 - Global Workspace (The "Theatre")
**Architecture**: Emily Sovereign V4 Triune
**Date**: 2026-01-12
**Status**: Draft
**Science**: Global Workspace Theory (Dehaene, 2014), Attention Schema Theory (Graziano, 2015)

---

## Table of Contents

1. [Overview](#1-overview)
2. [GlobalWorkspace Class](#2-globalworkspace-class)
3. [Salience Calculation](#3-salience-calculation)
4. [Competitive Selection](#4-competitive-selection)
5. [Broadcasting Mechanism](#5-broadcasting-mechanism)
6. [Input Types](#6-input-types)
7. [Neurotransmitter Integration](#7-neurotransmitter-integration)
8. [Performance Optimization](#8-performance-optimization)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Checklist](#10-deployment-checklist)

---

## 1. Overview

### 1.1 The Scientific Foundation

The Global Workspace implements **Dehaene's Global Workspace Theory (2014)**, which proposes that consciousness emerges from the broadcast of information across distributed neural assemblies. The workspace operates as a **limited-capacity buffer** where sensory inputs compete for conscious access.

**Key Principles**:
- **Miller's Law**: 7±2 items can be held in conscious awareness simultaneously
- **Salience Competition**: Only high-salience signals win the competition
- **Global Broadcasting**: Winners are transmitted to all cognitive modules
- **Attention Schema**: The workspace maintains a model of what is being attended to

### 1.2 Design Constraints

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Capacity | 7±2 slots | Miller's Law |
| Frame Rate | <100ms | Consciousness frame rate |
| Latency | <50ms per cycle | Real-time perception |
| Throughput | >100 inputs/sec | Multi-modal sensing |
| Persistence | Redis + AsyncIO Queue | Fault tolerance |

### 1.3 Key Dependencies

```python
import asyncio
import redis.asyncio
import numpy as np
from scipy.special import softmax
import structlog
from pydantic import BaseModel, Field
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from collections import deque
import math
```

---

## 2. GlobalWorkspace Class

### 2.1 Data Models

```python
class InputType(str, Enum):
    VISUAL = "visual"
    TEXT = "text"
    INTERNAL = "internal"
    REFLEX = "reflex"


class InputPriority(str, Enum):
    REFLEX = "reflex"
    URGENT = "urgent"
    NORMAL = "normal"
    BACKGROUND = "background"


@dataclass
class SalienceComponents:
    vision: float = 0.0
    text: float = 0.0
    internal: float = 0.0
    novelty: float = 0.0
    allostatic: float = 0.0
    total: float = 0.0


class WorkspaceInput(BaseModel):
    input_id: str
    input_type: InputType
    content: Any
    timestamp: datetime = Field(default_factory=datetime.now)
    priority: InputPriority = InputPriority.NORMAL
    ttl_seconds: int = 5
    salience_components: Optional[SalienceComponents] = None
    final_salience: float = Field(default=0.0, ge=0.0, le=1.0)
    source_module: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WorkspaceSlot(BaseModel):
    slot_id: int = Field(..., ge=0, le=8)
    occupied: bool = False
    current_input: Optional[WorkspaceInput] = None
    occupied_since: Optional[datetime] = None
    broadcast_count: int = 0
    total_broadcast_duration_ms: float = 0.0
```

### 2.2 Initialization

```python
class GlobalWorkspace:
    def __init__(
        self,
        capacity: int = 7,
        neurochemical_state: Optional[Dict[str, float]] = None,
        redis_url: Optional[str] = None,
        enable_persistence: bool = True
    ):
        # Miller's 7±2 constraint
        self._capacity = max(5, min(9, capacity))
        self._slots: List[WorkspaceSlot] = [
            WorkspaceSlot(slot_id=i) for i in range(self._capacity)
        ]
        
        # Input queues
        self._input_queue: asyncio.Queue[WorkspaceInput] = asyncio.Queue()
        self._reflex_queue: asyncio.Queue[WorkspaceInput] = asyncio.Queue()
        
        # Neurochemicals from Tier 1
        self._neurochemicals: Dict[str, float] = neurochemical_state or {
            'dopamine': 0.5,
            'serotonin': 0.5,
            'oxytocin': 0.5,
            'cortisol': 0.5,
            'norepinephrine': 0.5
        }
        
        # Salience weights (tunable)
        self._salience_weights = {
            'vision': 0.25,
            'text': 0.25,
            'internal': 0.20,
            'novelty': 0.15,
            'allostatic': 0.15
        }
        
        # Competition parameters
        self._competition_temperature = 1.0
        self._novelty_window: deque = deque(maxlen=100)
        self._attention_schema: Dict[str, datetime] = {}
        
        # Performance tracking
        self._cycle_count = 0
        self._total_broadcasts = 0
        self._latency_samples: deque = deque(maxlen=1000)
        
        # Broadcasting
        self._broadcast_subscribers: List[callable] = []
        
        # Persistence
        self._redis_client: Optional[redis.Redis] = None
        self._enable_persistence = enable_persistence
        
        # Control flags
        self._running = False
        self._competition_task: Optional[asyncio.Task] = None
        self._broadcast_task: Optional[asyncio.Task] = None
```
