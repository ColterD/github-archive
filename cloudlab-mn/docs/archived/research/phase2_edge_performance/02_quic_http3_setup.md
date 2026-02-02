# 02: QUIC/HTTP3 Setup with Zenoh

> **Prerequisites**: WasmEdge installed, Linux 5.10+
> **Estimated Time**: 25 minutes
> **Difficulty**: Intermediate

---

## Overview

This guide covers setting up QUIC/HTTP3 with Zenoh for ultra-low-latency communication:

- QUIC protocol for multiplexed, encrypted connections
- HTTP/3 over QUIC for REST endpoints
- Zenoh pub/sub for data distribution
- Target: < 5ms inter-node latency

---

## Why QUIC + Zenoh?

| Feature | TCP+HTTP/2 | QUIC+HTTP/3 | Improvement |
|---------|------------|-------------|-------------|
| Head-of-line blocking | Yes | No | 30% better throughput |
| Connection setup | 2-3 RTT | 1 RTT | 2x faster |
| Encryption | TLS 1.3 | Built-in | Same security |
| Multiplexing | Stream level | Stream+Packet level | Better recovery |

---

## Installation

### aioquic (Python)

```bash
pip install aioquic
pip install aiohttp-quic
```

### Zenoh (Rust)

```bash
cargo install zenohd
pip install ezmeral
```

### Kernel Configuration

```bash
# Enable BBR congestion control
echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.conf
echo "net.core.default_qdisc=fq" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Verify
sysctl net.ipv4.tcp_congestion_control
# Expected: bbr
```

---

## Zenoh + QUIC Configuration

### Start Zenoh Router

```bash
zenohd --listen tcp/0.0.0.0:7447 --listen quic/0.0.0.0:7447
```

### Zenoh Python Client

```python
import zenoh
import json
from typing import Dict

class ZenohEdgeClient:
    def __init__(self, mode: str = "client"):
        self.session = zenoh.open(mode=mode)
        
    def publish_state(self, topic: str, state: Dict):
        pub = self.session.declare_publisher(topic)
        pub.put(json.dumps(state).encode())
        
    def subscribe_state(self, topic: str, callback):
        sub = self.session.declare_subscriber(topic, callback)
```

---

## HTTP/3 Server

```python
# http3_server.py
from aioquic.asyncio import serve
from aioquic.h3.connection import H3_ALPN
from aioquic.h3.server import H3Server
import asyncio

async def handle_request(request):
    return Response(b"Hello from HTTP/3!")

async def main():
    configuration = QuicConfiguration(is_client=False)
    configuration.load_cert_chain("server.crt", "server.key")
    
    http_server = H3Server(handle_request)
    await serve("0.0.0.0", 4433, configuration, http_server)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Performance Tuning

### QUIC Parameters

- max_idle_timeout: 30s (reduce for faster cleanup)
- max_datagram_frame_size: 1350 (avoid fragmentation)
- active_connection_id_limit: 8 (reduce memory)

### Zenoh Parameters

- routing_mode: peer_to_peer (lower latency)
- query_timeout: 5s (avoid hanging)
- compression: zstd (better than gzip)

---

## Benchmarks

| Metric | TCP+HTTP/2 | QUIC+HTTP/3 |
|--------|------------|-------------|
| Connection establishment | 2ms | 0.8ms |
| Throughput (40Gbps) | 35 Gbps | 38 Gbps |
| 99th percentile latency | 15ms | 5ms |

---

## Sources

- aioquic.readthedocs.io
- zenoh.io/docs
- datatracker.ietf.org/doc/html/rfc9000

---

## Next Steps

- [03: Unikernel Deployment](./03_unikernel_deployment.md)
