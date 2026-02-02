#!/usr/bin/env python3
"""
Ray Performance Test
Tests distributed cognitive computing performance with Ray
"""

import ray
import time
import statistics
from typing import Dict, List
import numpy as np
from dataclasses import dataclass

# Initialize Ray
ray.init(ignore_reinit_error=True)

@dataclass
class CognitiveState:
    """Cognitive state for simulation."""
    dopamine: float = 0.5
    serotonin: float = 0.5
    cortisol: float = 0.5

@ray.remote
class NeurotransmitterActor:
    """Distributed neurotransmitter management."""
    
    def __init__(self):
        self.state = CognitiveState()
    
    def apply_delta(self, delta: Dict[str, float]) -> CognitiveState:
        """Apply state changes."""
        for key, value in delta.items():
            if hasattr(self.state, key):
                current = getattr(self.state, key)
                setattr(self.state, key, np.clip(current + value, 0.0, 1.0))
        return self.state
    
    def get_state(self) -> CognitiveState:
        return self.state

@ray.remote
class WorkspaceActor:
    """Distributed global workspace."""
    
    def __init__(self, capacity: int = 7):
        self.capacity = capacity
        self.buffer = []
    
    def broadcast(self, inputs: List[Dict]) -> Dict:
        """Broadcast highest-salience signals."""
        scored = [(np.random.uniform(0.3, 1.0), i) for i in inputs]
        scored.sort(reverse=True, key=lambda x: x[0])
        selected = [item for score, item in scored[:self.capacity]]
        return {"broadcast": selected, "count": len(selected)}

@ray.remote
class InferenceActor:
    """Distributed inference engine."""
    
    def __init__(self):
        self.model = "simulated_model"
    
    def compute_free_energy(self, state: Dict, policy: str) -> float:
        """Compute expected free energy."""
        time.sleep(0.001)  # Simulate computation
        return np.random.uniform(0.1, 0.5)

def benchmark_actor_spawn(count: int = 100) -> Dict:
    """Benchmark actor spawning performance."""
    times = []
    
    for _ in range(count):
        start = time.perf_counter_ns()
        actor = NeurotransmitterActor.remote()
        _ = ray.get(actor.get_state.remote())
        elapsed = (time.perf_counter_ns() - start) / 1_000_000  # ms
        times.append(elapsed)
        ray.kill(actor)
    
    return {
        "mean": statistics.mean(times),
        "median": statistics.median(times),
        "p95": statistics.quantiles(times, n=20)[18],
        "count": count
    }

def benchmark_inference(cycles: int = 1000) -> Dict:
    """Benchmark inference performance."""
    times = []
    
    # Create actors
    neuro = NeurotransmitterActor.remote()
    workspace = WorkspaceActor.remote()
    inference = InferenceActor.remote()
    
    for _ in range(cycles):
        start = time.perf_counter_ns()
        
        # Get state
        state = ray.get(neuro.get_state.remote())
        
        # Broadcast
        input_data = [{"value": i} for i in range(10)]
        broadcast = ray.get(workspace.broadcast(input_data))
        
        # Inference
        free_energy = ray.get(inference.compute_free_energy(state.__dict__, "policy_1"))
        
        # Apply delta
        delta = {"dopamine": 0.1, "cortisol": -0.05}
        _ = ray.get(neuro.apply_delta.remote(delta))
        
        elapsed = (time.perf_counter_ns() - start) / 1_000_000  # ms
        times.append(elapsed)
    
    # Cleanup
    ray.kill(neuro)
    ray.kill(workspace)
    ray.kill(inference)
    
    return {
        "mean": statistics.mean(times),
        "median": statistics.median(times),
        "p95": statistics.quantiles(times, n=20)[18],
        "throughput": cycles / sum(times) * 1000,  # ops/sec
        "cycles": cycles
    }

def benchmark_parallel_inference(cycles: int = 100, parallel: int = 10) -> Dict:
    """Benchmark parallel inference."""
    start_total = time.perf_counter_ns()
    
    # Create actors
    actors = [NeurotransmitterActor.remote() for _ in range(parallel)]
    
    futures = []
    for _ in range(cycles):
        for actor in actors:
            futures.append(actor.apply_delta.remote({"dopamine": 0.1}))
    
    ray.get(futures)
    
    total_time = (time.perf_counter_ns() - start_total) / 1_000_000  # ms
    
    # Cleanup
    for actor in actors:
        ray.kill(actor)
    
    return {
        "total_time_ms": total_time,
        "throughput_ops": (cycles * parallel) / total_time * 1000,
        "parallel": parallel,
        "cycles": cycles
    }

def print_results(results: Dict):
    """Print benchmark results."""
    print("\n" + "=" * 60)
    print("Ray Performance Test Results")
    print("=" * 60)
    
    # Actor spawn
    if "actor_spawn" in results:
        spawn = results["actor_spawn"]
        print("\nActor Spawn Performance:")
        print(f"  Mean:   {spawn['mean']:.3f} ms")
        print(f"  Median: {spawn['median']:.3f} ms")
        print(f"  P95:    {spawn['p95']:.3f} ms")
    
    # Inference
    if "inference" in results:
        inf = results["inference"]
        print("\nSingle-Threaded Inference:")
        print(f"  Mean:       {inf['mean']:.3f} ms")
        print(f"  Throughput: {inf['throughput']:.0f} ops/sec")
    
    # Parallel inference
    if "parallel_inference" in results:
        par = results["parallel_inference"]
        print("\nParallel Inference:")
        print(f"  Total Time:  {par['total_time_ms']:.1f} ms")
        print(f"  Throughput:  {par['throughput_ops']:.0f} ops/sec")
        print(f"  Parallelism: {par['parallel']}")
    
    # System info
    print("\nSystem Information:")
    print(f"  Cluster size: {len(ray.nodes())} nodes")
    print(f"  CPUs: {ray.cluster_resources().get('CPU', 0)}")
    print(f"  GPUs: {ray.cluster_resources().get('GPU', 0)}")
    
    print("\n" + "=" * 60)

def main():
    """Run all benchmarks."""
    print("Starting Ray Performance Test...")
    print(f"Ray version: {ray.__version__}")
    
    results = {}
    
    # Actor spawn benchmark
    print("\nBenchmarking actor spawn...")
    results["actor_spawn"] = benchmark_actor_spawn(count=100)
    
    # Inference benchmark
    print("\nBenchmarking inference...")
    results["inference"] = benchmark_inference(cycles=1000)
    
    # Parallel inference benchmark
    print("\nBenchmarking parallel inference...")
    results["parallel_inference"] = benchmark_parallel_inference(cycles=100, parallel=10)
    
    # Print results
    print_results(results)
    
    # Shutdown
    ray.shutdown()
    
    print("\nBenchmark complete!")

if __name__ == "__main__":
    main()
