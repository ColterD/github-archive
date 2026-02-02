# Network Optimization Strategies

Comprehensive guide to optimizing network performance for Emily Sovereign V4 on CloudLab c220g5.

## Network Context

### CloudLab c220g5 Network
- **Speed**: 1 Gbps
- **Latency**: ~1-2ms (local network)
- **Interface**: Intel X710 (10GbE, limited to 1Gbps)
- **MTU**: Default 1500 (can increase to 9000)

## QUIC & HTTP/3 Deployment

### aioquic Installation
```python
# phase2_edge_performance/02_quic_http3_setup.py
import asyncio
from aioquic.asyncio import serve
from aioquic.quic.configuration import QuicConfiguration

async def handle_request(request):
    return b"Hello, QUIC!"

async def start_quic_server():
    config = QuicConfiguration(
        max_datagram_frame_size=1350,  # Optimize for 1Gbps
        max_connection_window=1048576,  # 1MB window
        max_stream_window=1048576,    # 1MB stream window
    )

    await serve(
        "0.0.0.0",
        443,
        configuration=config,
        create_protocol=handle_request,
    )

asyncio.run(start_quic_server())
```

### QUIC Configuration (Optimized for 1Gbps)
```python
# QUIC connection parameters optimized for CloudLab
quic_config = {
    # Max datagram size (1350 bytes = 1Gbps / 1024^2 * 8 * RTT)
    'max_datagram_frame_size': 1350,

    # Flow control (1MB windows)
    'max_connection_window': 1048576,
    'max_stream_window': 1048576,

    # Congestion control (BBR)
    'congestion_control_algorithm': 'bbr',

    # Disable packet pacing (let kernel handle)
    'enable_packet_pacing': False,

    # Ack frequency (optimize for throughput)
    'ack_delay_exponent': 2,  # 2^2 = 4 * 10ms = 40ms
}
```

### Expected QUIC Performance vs TCP
| Metric | TCP (CUBIC) | QUIC | Improvement |
|--------|---------------|-------|-------------|
| **Throughput (1Gbps)** | ~800 Mbps | ~950 Mbps | +19% |
| **Head-of-Line Blocking** | Yes | No | ✅ Eliminated |
| **Connection Setup** | 2-3 RTT | 0-1 RTT (0-RTT resume) | ⚡ Faster |
| **Connection Migration** | Drop | Seamless | ✅ Better reliability |
| **Multiplexed Streams** | No (one per TCP) | Yes (100+ streams) | ⚡ More efficient |

## BBR Congestion Control

### BBR Installation (NixOS)
```nix
# phase0_nixos_setup/example_configuration.nix
boot.kernelParams = {
  # Enable BBR
  "net.ipv4.tcp_congestion_control" = "bbr";

  # BBR tuning
  "net.core.default_qdisc" = "fq";  # Fair queueing

  # Additional TCP optimizations
  "net.ipv4.tcp_slow_start_after_idle" = "0";
  "net.ipv4.tcp_no_metrics_save" = "1";

  # Window scaling (critical for high BDP)
  "net.ipv4.tcp_window_scaling" = "1";
  "net.ipv4.tcp_rmem" = "4096 87380 16777216";
  "net.ipv4.tcp_wmem" = "4096 65536 16777216";

  # MTU (jumbo frames)
  "net.ipv4.tcp_mtu_probing" = "1";
};
```

### BBR vs. CUBIC Comparison
| Metric | CUBIC | BBR | Improvement |
|--------|--------|------|-------------|
| **Algorithm Type** | Loss-based | Model-based | ✅ More accurate |
| **High BDP Networks** | Poor | Excellent | ⚡ 15-30% better |
| **Congestion Detection** | Packet loss | RTT increase | ✅ Faster reaction |
| **WiFi/Lossy Networks** | Poor | Good | ✅ More stable |
| **Fairness** | Good | Fair | ~ Similar |

### BBR Tuning (Advanced)
```bash
# Check current congestion control
sysctl net.ipv4.tcp_congestion_control

# Verify BBR is active
ss -tin state established '( dport =:443 or sport =:443 )' | \
  awk '{print $6}' | sort -u

# Monitor BBR performance
ss -tin state established | \
  awk '{if($6 == "bbr") print}'
```

## Jumbo Frames (MTU 9000)

### MTU Configuration
```nix
# phase0_nixos_setup/example_configuration.nix
networking.interfaces.enp2s0f0.mtu = 9000;

# Or per-route
networking.routes = [
  {
    destination = "10.0.0.0/8";
    via = "10.0.0.1";
    mtu = 9000;
  }
];
```

### Jumbo Frame Performance
| MTU | Max Throughput | Packet Overhead | Efficiency |
|-----|----------------|----------------|------------|
| 1500 | 800 Mbps | ~5% | Baseline |
| 9000 | 950 Mbps | ~0.8% | +19% better |

**Recommendation**: Enable jumbo frames (9000 MTU) if network supports it.

### MTU Verification
```bash
# Check current MTU
ip link show enp2s0f0

# Verify path MTU
ping -M -c 1 -s 8972 10.0.0.1

# If fragmentation occurs, lower MTU
ip link set enp2s0f0 mtu 1500
```

## WireGuard VPN Optimization

### WireGuard Configuration
```nix
# phase0_nixos_setup/03_network_configuration.nix
networking.wg-quick.interfaces = {
  wg0 = {
    address = [ "10.0.1.1/24" ];
    listenPort = 51820;
    privateKeyFile = "/etc/wireguard/privatekey";
    peers = [
      {
        publicKey = "PEER_PUBLIC_KEY";
        allowedIPs = [ "10.0.1.2/32" ];
        endpoint = "EXTERNAL_IP:51820";
      }
    ];

    # WireGuard optimizations
    fwmark = "0x6969";  # Firewall mark
    persistentKeepalive = 25;
  };
};
```

### WireGuard Performance Tuning
```bash
# Check WireGuard throughput
iperf3 -c 10.0.1.2 -t 60

# Expected: ~900-950 Mbps (with BBR + jumbo frames)

# Verify BBR over WireGuard
ss -ti '(sport =:51820 or dport =:51820)' | awk '{print $6}'
```

### WireGuard + SMB Optimization
```bash
# SMB over WireGuard (specific IP, no multichannel)
smbclient //10.0.1.2/share -U user

# Optimized for 1Gbps network
# MTU: 9000 (if supported)
# Protocol: SMB3
# Socket: TCP_NODELAY
```

## Cilium Networking

### Cilium BBR Configuration
```yaml
# phase1_foundation/01_observability_setup.yaml
apiVersion: cilium.io/v1alpha1
kind: CiliumConfig
metadata:
  name: cilium-config
spec:
  # Enable BBR in Cilium
  bpf:
    policyEnforcement: "default"

  # Tunnel protocol (VXLAN over QUIC)
  tunnel: "vxlan"

  # MTU (matches jumbo frames)
  tunnelMTU: 9000

  # Bandwidth management
  bandwidthManager: "bbr"

  # Load balancing
  loadBalancer:
    algorithm: "random"
    mode: "dsr"  # Direct server return
```

### Cilium + Hubble Performance
```bash
# Check Cilium status
cilium status --wait

# Verify Hubble is running
hubble status

# Monitor network flows
hubble observe --protocol tcp --port 443
```

## Network Monitoring

### Prometheus Network Metrics
```yaml
# scrape_configs for network
scrape_configs:
  - job_name: 'node_exporter'
    static_configs:
      - targets: ['localhost:9100']
    metrics_path: '/metrics'
    relabel_configs:
      - source_labels: [__name__]
        regex: '(node_network_.*)'
        target_label: __name__
        replacement: '${1}'
```

### Key Network Metrics
- **node_network_receive_bytes_total**: Inbound traffic
- **node_network_transmit_bytes_total**: Outbound traffic
- **node_network_receive_errs_total**: Receive errors
- **node_network_transmit_errs_total**: Transmit errors
- **node_tcp_connection_states**: Connection states (ESTABLISHED, etc.)

## Troubleshooting

### 1. Slow Network Performance
```bash
# Check congestion control
sysctl net.ipv4.tcp_congestion_control

# Verify BBR is being used
ss -tin | grep bbr

# Check for packet loss
ping -c 100 10.0.0.1

# Check interface errors
ip -s link show enp2s0f0
```

### 2. QUIC Connection Issues
```bash
# Check QUIC server logs
journalctl -u quic -f

# Verify firewall allows UDP
iptables -L -n -v | grep 443/udp

# Check MTU path
ping -M -c 1 -s 8972 10.0.0.1
```

### 3. WireGuard Performance Issues
```bash
# Check WireGuard status
wg show

# Check throughput
iperf3 -c PEER_IP -t 60

# Verify persistent keepalive
wg show | grep "persistent keepalive"
```

## Performance Benchmarks

### Expected Network Performance (CloudLab c220g5)
| Scenario | Throughput | Latency | Notes |
|----------|------------|----------|-------|
| **Local TCP** | 950 Mbps | 1ms | Direct connect |
| **Local QUIC** | 950 Mbps | 1ms | Direct connect |
| **WireGuard TCP** | 900 Mbps | 2ms | VPN |
| **WireGuard QUIC** | 900 Mbps | 2ms | VPN (if QUIC over WG) |
| **SMB over WireGuard** | 800 Mbps | 2ms | File sharing |
| **Jumbo Frames** | 950 Mbps | 1ms | MTU 9000 |
| **BBR (vs. CUBIC)** | +19% throughput | - | High BDP networks |

---

**Last Updated**: 2026-01-12

**For AI Agents**: When optimizing network:
1. Test configurations before deploying to production
2. Monitor metrics before/after changes
3. Use iperf3 for throughput testing
4. Check MTU path compatibility
5. Monitor packet loss and errors
