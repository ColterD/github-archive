#!/usr/bin/env python3
"""
QUIC + Zenoh Bridge for Emily Sovereign V4
Connects cognitive modules to edge mesh via QUIC
"""

import asyncio
import json
from pathlib import Path
from typing import Dict, Callable, Optional

try:
    import zenoh
except ImportError:
    print("Install: pip install ezmeral")
    raise

class ZenohQUICBridge:
    """Bridge between Zenoh pub/sub and QUIC transport."""
    
    def __init__(self, mode: str = "peer", quic_port: int = 7447):
        """
        Initialize bridge.
        
        Args:
            mode: Zenoh mode ("client", "peer", "router")
            quic_port: QUIC port for Zenoh
        """
        self.mode = mode
        self.quic_port = quic_port
        self.session = None
        self.publishers = {}
        self.subscribers = {}
    
    async def connect(self, locator: Optional[str] = None) -> bool:
        """
        Connect to Zenoh router.
        
        Args:
            locator: Router address (e.g., "tcp/192.168.1.100:7447")
        
        Returns:
            Connection success status
        """
        try:
            self.session = zenoh.open(
                mode=self.mode,
                locator=locator,
                listen=f"quic/0.0.0.0:{self.quic_port}"
            )
            print(f"Connected to Zenoh (mode: {self.mode})")
            return True
        except Exception as e:
            print(f"Failed to connect: {e}")
            return False
    
    def publish(self, topic: str, data: Dict) -> bool:
        """
        Publish data to Zenoh topic.
        
        Args:
            topic: Zenoh topic (e.g., "cognitive/neurotransmitters")
            data: Dictionary data to publish
        
        Returns:
            Success status
        """
        if not self.session:
            print("Not connected to Zenoh")
            return False
        
        try:
            if topic not in self.publishers:
                self.publishers[topic] = self.session.declare_publisher(topic)
            
            self.publishers[topic].put(json.dumps(data).encode())
            return True
        except Exception as e:
            print(f"Failed to publish to {topic}: {e}")
            return False
    
    def subscribe(self, topic: str, callback: Callable[[Dict], None]) -> bool:
        """
        Subscribe to Zenoh topic.
        
        Args:
            topic: Zenoh topic to subscribe to
            callback: Function to call when data received
        
        Returns:
            Success status
        """
        if not self.session:
            print("Not connected to Zenoh")
            return False
        
        try:
            def _callback(reply):
                try:
                    data = json.loads(reply.value.payload.decode())
                    callback(data)
                except Exception as e:
                    print(f"Failed to parse message: {e}")
            
            sub = self.session.declare_subscriber(topic, _callback)
            self.subscribers[topic] = sub
            print(f"Subscribed to {topic}")
            return True
        except Exception as e:
            print(f"Failed to subscribe to {topic}: {e}")
            return False
    
    def close(self):
        """Close Zenoh session."""
        if self.session:
            self.session.close()
            self.session = None


class CognitiveMessageBridge:
    """High-level bridge for Emily Sovereign V4 messages."""
    
    def __init__(self):
        self.bridge = ZenohQUICBridge(mode="peer", quic_port=7447)
    
    async def start(self, router_addr: Optional[str] = None):
        """Start the bridge."""
        await self.bridge.connect(router_addr)
    
    def publish_neurotransmitters(self, state: Dict[str, float]) -> bool:
        """Publish neurotransmitter state."""
        return self.bridge.publish("cognitive/neurotransmitters", state)
    
    def publish_workspace(self, signals: list) -> bool:
        """Publish global workspace signals."""
        return self.bridge.publish("cognitive/workspace", {"signals": signals})
    
    def publish_inference(self, policy: str, free_energy: float) -> bool:
        """Publish inference result."""
        return self.bridge.publish("cognitive/inference", {
            "policy": policy,
            "free_energy": free_energy
        })
    
    def subscribe_input(self, callback):
        """Subscribe to external input."""
        return self.bridge.subscribe("input/sensor", callback)
    
    def stop(self):
        """Stop the bridge."""
        self.bridge.close()


# Example usage
async def main():
    """Example: Run cognitive bridge."""
    bridge = CognitiveMessageBridge()
    await bridge.start()
    
    # Callback for input
    def on_input(data: Dict):
        print(f"Received input: {data}")
        # Process with cognitive modules...
    
    bridge.subscribe_input(on_input)
    
    # Publish state
    state = {"dopamine": 0.7, "serotonin": 0.5, "cortisol": 0.3}
    bridge.publish_neurotransmitters(state)
    
    # Keep running
    await asyncio.sleep(60)
    bridge.stop()


if __name__ == "__main__":
    asyncio.run(main())
