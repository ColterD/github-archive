#!/usr/bin/env python3
"""
WasmEdge Latency Benchmark
Measures cognitive inference latency on WasmEdge vs Native Python
"""

import subprocess
import time
import statistics
from typing import Dict, List
import json
import sys
from pathlib import Path

def benchmark_native_python(module_path: str, cycles: int = 100) -> Dict[str, float]:
    """Benchmark native Python performance."""
    times = []
    
    for _ in range(cycles):
        start = time.perf_counter_ns()
        
        # Run native Python (simulated cognitive inference)
        result = subprocess.run(
            [sys.executable, "-c", """
import sys
sys.path.insert(0, '.')
# Simulate cognitive processing
dopamine = 0.5
dopamine = min(1.0, max(0.0, dopamine + 0.1))
# Compute salience
salience = dopamine * 0.7 + 0.3
result = {"salience": salience}
print(result)
            """],
            capture_output=True,
            timeout=1
        )
        
        elapsed = (time.perf_counter_ns() - start) / 1_000_000  # ms
        times.append(elapsed)
    
    return {
        "mean": statistics.mean(times),
        "median": statistics.median(times),
        "p95": statistics.quantiles(times, n=20)[18],
        "p99": statistics.quantiles(times, n=100)[98]
    }

def benchmark_wasmedge(wasm_path: str, cycles: int = 100) -> Dict[str, float]:
    """Benchmark WasmEdge performance."""
    times = []
    
    # Check if WasmEdge is available
    try:
        subprocess.run(
            ["wasmedge", "--version"],
            capture_output=True,
            check=True,
            timeout=5
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("WasmEdge not found. Skipping WasmEdge benchmark.")
        return {"error": "WasmEdge not found"}
    
    if not Path(wasm_path).exists():
        print(f"WASM file not found: {wasm_path}")
        return {"error": "WASM file not found"}
    
    for _ in range(cycles):
        start = time.perf_counter_ns()
        
        try:
            result = subprocess.run(
                ["wasmedge", "--dir", str(Path(wasm_path).parent), wasm_path],
                capture_output=True,
                timeout=1
            )
        except subprocess.TimeoutExpired:
            times.append(1000)  # Timeout as 1 second
            continue
        
        elapsed = (time.perf_counter_ns() - start) / 1_000_000  # ms
        times.append(elapsed)
    
    return {
        "mean": statistics.mean(times),
        "median": statistics.median(times),
        "p95": statistics.quantiles(times, n=20)[18],
        "p99": statistics.quantiles(times, n=100)[98]
    }

def benchmark_startup(runtime: str, cycles: int = 10) -> Dict[str, float]:
    """Benchmark startup time."""
    times = []
    
    cmd_map = {
        "native": [sys.executable, "-c", "print('ready')"],
        "wasmedge": ["wasmedge", "--version"]
    }
    
    cmd = cmd_map.get(runtime, cmd_map["native"])
    
    for _ in range(cycles):
        start = time.perf_counter_ns()
        
        try:
            subprocess.run(cmd, capture_output=True, timeout=5, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            times.append(1000)  # Timeout
            continue
        
        elapsed = (time.perf_counter_ns() - start) / 1_000_000  # ms
        times.append(elapsed)
    
    return {
        "mean": statistics.mean(times),
        "median": statistics.median(times)
    }

def print_results(results: Dict):
    """Print benchmark results."""
    print("\n" + "=" * 60)
    print("WasmEdge Latency Benchmark Results")
    print("=" * 60)
    
    # Native Python
    if "native" in results:
        native = results["native"]
        print("\nNative Python:")
        print(f"  Mean:   {native['mean']:.3f} ms")
        print(f"  Median: {native['median']:.3f} ms")
        print(f"  P95:    {native['p95']:.3f} ms")
        print(f"  P99:    {native['p99']:.3f} ms")
    
    # WasmEdge
    if "wasmedge" in results:
        wasmedge = results["wasmedge"]
        if "error" not in wasmedge:
            print("\nWasmEdge:")
            print(f"  Mean:   {wasmedge['mean']:.3f} ms")
            print(f"  Median: {wasmedge['median']:.3f} ms")
            print(f"  P95:    {wasmedge['p95']:.3f} ms")
            print(f"  P99:    {wasmedge['p99']:.3f} ms")
            
            # Compare
            if "native" in results:
                ratio = wasmedge['mean'] / results["native"]['mean']
                print(f"\n  Speedup ratio: {ratio:.2f}x")
                if ratio < 1:
                    print(f"  WasmEdge is {1/ratio:.2f}x SLOWER")
                else:
                    print(f"  WasmEdge is {ratio:.2f}x FASTER")
        else:
            print(f"\nWasmEdge: {wasmedge['error']}")
    
    # Startup times
    if "startup" in results:
        startup = results["startup"]
        print("\nStartup Times:")
        print(f"  Native Python: {startup['native']['mean']:.3f} ms")
        print(f"  WasmEdge:      {startup.get('wasmedge', {}).get('mean', 0):.3f} ms")
    
    print("\n" + "=" * 60)

def main():
    """Run all benchmarks."""
    print("Starting WasmEdge Latency Benchmark...")
    
    results = {}
    
    # Benchmark native Python
    print("\nBenchmarking native Python...")
    results["native"] = benchmark_native_python(".", cycles=100)
    
    # Benchmark WasmEdge (if available)
    print("\nBenchmarking WasmEdge...")
    results["wasmedge"] = benchmark_wasmedge("cognitive_core.wasm", cycles=100)
    
    # Benchmark startup times
    print("\nBenchmarking startup times...")
    results["startup"] = {}
    results["startup"]["native"] = benchmark_startup("native", cycles=10)
    results["startup"]["wasmedge"] = benchmark_startup("wasmedge", cycles=10)
    
    # Print results
    print_results(results)
    
    # Save to file
    output_file = Path("wasm_latency_results.json")
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to {output_file}")

if __name__ == "__main__":
    main()
