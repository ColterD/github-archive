# Phase 3: Global Workspace - Part 2: Salience Calculation

---

## 3. Salience Calculation

### 3.1 Multi-Factor Formula

The total salience is computed as a weighted sum of multiple factors:

```
S_total = w_v*S_vision + w_t*S_Text + w_i*S_Internal + w_n*S_Novelty + w_a*S_Allostatic
```

Where:
- `w_*` are tunable weights (default: vision=0.25, text=0.25, internal=0.20, novelty=0.15, allostatic=0.15)
- `S_*` are individual salience components (normalized to [0, 1])

### 3.2 Vision Salience (Itti & Koch Model)

Based on Itti & Koch (2001) saliency detection model:

```python
def _calculate_vision_salience(self, input_data: WorkspaceInput) -> float:
    intensity = getattr(input_data.content, 'intensity', 0.5)
    motion = getattr(input_data.content, 'motion', 0.0)
    contrast = getattr(input_data.content, 'contrast', 0.5)
    has_face = getattr(input_data.content, 'has_face', False)
    
    salience = 0.3 * intensity + 0.3 * motion + 0.2 * contrast + (0.2 if has_face else 0.0)
    
    # Dopamine modulation
    da_boost = 1.0 + 0.3 * (self._neurochemicals['dopamine'] - 0.5)
    
    return min(salience * da_boost, 1.0)
```

### 3.3 Text Salience

```python
def _calculate_text_salience(self, input_data: WorkspaceInput) -> float:
    if not isinstance(input_data.content, str):
        return 0.0
    
    text = input_data.content
    urgency_keywords = {'help', 'error', 'urgent', 'critical', 'stop', 'danger'}
    urgency_score = sum(1 for word in urgency_keywords if word.lower() in text.lower())
    
    semantic_score = input_data.metadata.get('semantic_similarity', 0.5)
    length = len(text)
    length_factor = min(length / 100.0, 1.0) if length < 200 else max(0.5, 1.0 - (length - 200) / 1000.0)
    caps_factor = 1.0 if text.isupper() or any(c.isupper() for c in text[:10]) else 0.8
    
    salience = 0.3 * min(urgency_score / 3.0, 1.0) + 0.3 * semantic_score + 0.2 * length_factor + 0.2 * caps_factor
    
    # Norepinephrine modulation
    ne_boost = 1.0 + 0.2 * (self._neurochemicals['norepinephrine'] - 0.5)
    
    return min(salience * ne_boost, 1.0)
```

### 3.4 Internal Urgency

```python
def _calculate_internal_salience(self, input_data: WorkspaceInput) -> float:
    deviation = input_data.metadata.get('homeostatic_deviation', 0.0)
    urgency = input_data.metadata.get('urgency', 0.5)
    
    # Sigmoid function
    salience = 1.0 / (1.0 + math.exp(-10 * (deviation - 0.5)))
    salience = 0.7 * salience + 0.3 * urgency
    
    # Cortisol suppression
    cort_suppression = 1.0 - 0.3 * (self._neurochemicals['cortisol'] - 0.5)
    
    return min(salience * cort_suppression, 1.0)
```

### 3.5 Novelty Calculation

```python
def _calculate_novelty(self, input_data: WorkspaceInput) -> float:
    if input_data.input_id in self._novelty_window:
        return 0.0
    
    novelty = 1.0
    
    # Oxytocin boosts social novelty
    if input_data.metadata.get('is_social', False):
        novelty += 0.1 * (self._neurochemicals['oxytocin'] - 0.5)
    
    return min(novelty, 1.0)
```

### 3.6 Allostatic Modulation

```python
def _calculate_allostatic_modulation(self, input_data: WorkspaceInput) -> float:
    modulation = 0.5
    
    if input_data.metadata.get('is_rewarding', False):
        modulation += 0.3 * self._neurochemicals['dopamine']
    
    if input_data.metadata.get('is_social', False):
        modulation += 0.3 * self._neurochemicals['oxytocin']
    
    # Serotonin stabilization
    stabilization = 1.0 - 0.2 * (self._neurochemicals['serotonin'] - 0.5)
    modulation *= stabilization
    
    # Norepinephrine vigilance
    vigilance = 1.0 + 0.2 * (self._neurochemicals['norepinephrine'] - 0.5)
    modulation *= vigilance
    
    return min(modulation, 1.0)
```

### 3.7 Final Salience Computation

```python
def _compute_final_salience(self, components: SalienceComponents, input_type: InputType) -> float:
    final = components.total
    
    if input_type == InputType.REFLEX:
        final = 1.0
    elif input_type == InputType.INTERNAL:
        final = min(final * 1.2, 1.0)
    
    return min(max(final, 0.0), 1.0)
```

### 3.8 Salience Calculation Pipeline

```python
def _calculate_salience_components(self, input_data: WorkspaceInput) -> SalienceComponents:
    components = SalienceComponents()
    
    if input_data.input_type == InputType.VISUAL:
        components.vision = self._calculate_vision_salience(input_data)
    elif input_data.input_type == InputType.TEXT:
        components.text = self._calculate_text_salience(input_data)
    elif input_data.input_type == InputType.INTERNAL:
        components.internal = self._calculate_internal_salience(input_data)
    
    components.novelty = self._calculate_novelty(input_data)
    components.allostatic = self._calculate_allostatic_modulation(input_data)
    
    components.total = (
        self._salience_weights['vision'] * components.vision +
        self._salience_weights['text'] * components.text +
        self._salience_weights['internal'] * components.internal +
        self._salience_weights['novelty'] * components.novelty +
        self._salience_weights['allostatic'] * components.allostatic
    )
    
    return components
```
