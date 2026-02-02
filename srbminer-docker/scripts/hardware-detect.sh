#!/bin/bash
set -e

# This script provides hardware detection capabilities in JSON format
# for the web UI configuration wizard

# Create a temporary file for the results
TEMP_FILE=$(mktemp)
trap 'rm -f "$TEMP_FILE"' EXIT

echo "{" > $TEMP_FILE
echo "  \"cpu\": {" >> $TEMP_FILE

# Detect CPU information
CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | cut -d':' -f2 | sed 's/^[ \t]*//')
CPU_CORES=$(grep -c ^processor /proc/cpuinfo)
CPU_AES=$(grep -q "aes" /proc/cpuinfo && echo "true" || echo "false")
CPU_AVX=$(grep -q "avx" /proc/cpuinfo && echo "true" || echo "false")
CPU_AVX2=$(grep -q "avx2" /proc/cpuinfo && echo "true" || echo "false")
CPU_MEM=$(free -g | grep Mem | awk '{print $2}')

echo "    \"model\": \"$CPU_MODEL\"," >> $TEMP_FILE
echo "    \"cores\": $CPU_CORES," >> $TEMP_FILE
echo "    \"aes\": $CPU_AES," >> $TEMP_FILE
echo "    \"avx\": $CPU_AVX," >> $TEMP_FILE
echo "    \"avx2\": $CPU_AVX2," >> $TEMP_FILE
echo "    \"memory_gb\": $CPU_MEM," >> $TEMP_FILE
echo "    \"recommended_threads\": $(($CPU_CORES / 2))" >> $TEMP_FILE
echo "  }," >> $TEMP_FILE

# Detect NVIDIA GPUs
echo "  \"nvidia_gpus\": [" >> $TEMP_FILE
if command -v nvidia-smi &> /dev/null; then
    FIRST_GPU=true
    nvidia-smi --query-gpu=index,name,memory.total,driver_version --format=csv,noheader,nounits 2>/dev/null | while IFS="," read -r INDEX NAME MEMORY DRIVER; do
        if [ "$FIRST_GPU" = "true" ]; then
            FIRST_GPU=false
        else
            echo "," >> $TEMP_FILE
        fi
        
        # Clean up field values
        NAME=$(echo "$NAME" | sed 's/^ *//' | sed 's/ *$//')
        MEMORY=$(echo "$MEMORY" | sed 's/^ *//' | sed 's/ *$//')
        DRIVER=$(echo "$DRIVER" | sed 's/^ *//' | sed 's/ *$//')
        
        echo "    {" >> $TEMP_FILE
        echo "      \"index\": $INDEX," >> $TEMP_FILE
        echo "      \"name\": \"$NAME\"," >> $TEMP_FILE
        echo "      \"memory_mb\": $MEMORY," >> $TEMP_FILE
        echo "      \"driver\": \"$DRIVER\"," >> $TEMP_FILE
        echo "      \"recommended_intensity\": 21" >> $TEMP_FILE
        echo "    }" >> $TEMP_FILE
    done
fi
echo "  ]," >> $TEMP_FILE

# Detect AMD GPUs
echo "  \"amd_gpus\": [" >> $TEMP_FILE
if command -v rocm-smi &> /dev/null; then
    FIRST_GPU=true
    rocm-smi --showproductname --showmeminfo vram --showhw --csv 2>/dev/null | grep -v "=" | tail -n +2 | while IFS="," read -r INDEX NAME MEMORY REST; do
        if [ "$FIRST_GPU" = "true" ]; then
            FIRST_GPU=false
        else
            echo "," >> $TEMP_FILE
        fi
        
        # Clean up field values
        NAME=$(echo "$NAME" | sed 's/^ *//' | sed 's/ *$//')
        MEMORY=$(echo "$MEMORY" | sed 's/^ *//' | sed 's/ *$//' | awk '{print $1}')
        
        echo "    {" >> $TEMP_FILE
        echo "      \"index\": $INDEX," >> $TEMP_FILE
        echo "      \"name\": \"$NAME\"," >> $TEMP_FILE
        echo "      \"memory_mb\": $MEMORY," >> $TEMP_FILE
        echo "      \"recommended_intensity\": 21" >> $TEMP_FILE
        echo "    }" >> $TEMP_FILE
    done
else
    # Try detection through system directories
    if [ -d "/sys/class/drm" ]; then
        AMD_CARDS=$(ls -l /sys/class/drm/card*/device/vendor | grep -i "0x1002" 2>/dev/null)
        if [ ! -z "$AMD_CARDS" ]; then
            FIRST_GPU=true
            INDEX=0
            for CARD in $(ls -d /sys/class/drm/card*/device/ 2>/dev/null | grep -l "0x1002" -); do
                if [ "$FIRST_GPU" = "true" ]; then
                    FIRST_GPU=false
                else
                    echo "," >> $TEMP_FILE
                fi
                
                # Try to get name
                if [ -f "${CARD}/product_name" ]; then
                    NAME=$(cat "${CARD}/product_name" 2>/dev/null || echo "AMD GPU")
                else
                    NAME="AMD GPU"
                fi
                
                # Try to get device ID
                if [ -f "${CARD}/device" ]; then
                    DEVICE_ID=$(cat "${CARD}/device" 2>/dev/null || echo "Unknown")
                else
                    DEVICE_ID="Unknown"
                fi
                
                echo "    {" >> $TEMP_FILE
                echo "      \"index\": $INDEX," >> $TEMP_FILE
                echo "      \"name\": \"$NAME\"," >> $TEMP_FILE
                echo "      \"device_id\": \"$DEVICE_ID\"," >> $TEMP_FILE
                echo "      \"recommended_intensity\": 21" >> $TEMP_FILE
                echo "    }" >> $TEMP_FILE
                
                INDEX=$((INDEX+1))
            done
        fi
    fi
fi
echo "  ]," >> $TEMP_FILE

# Detect Intel GPUs
echo "  \"intel_gpus\": [" >> $TEMP_FILE
if [ -d "/sys/class/drm" ]; then
    INTEL_CARDS=$(ls -l /sys/class/drm/card*/device/vendor | grep -i "0x8086" 2>/dev/null)
    if [ ! -z "$INTEL_CARDS" ]; then
        FIRST_GPU=true
        INDEX=0
        for CARD in $(ls -d /sys/class/drm/card*/device/ 2>/dev/null | grep -l "0x8086" -); do
            if [ "$FIRST_GPU" = "true" ]; then
                FIRST_GPU=false
            else
                echo "," >> $TEMP_FILE
            fi
            
            # Try to get name
            if [ -f "${CARD}/product_name" ]; then
                NAME=$(cat "${CARD}/product_name" 2>/dev/null || echo "Intel GPU")
            else
                NAME="Intel GPU"
            fi
            
            # Try to get device ID
            if [ -f "${CARD}/device" ]; then
                DEVICE_ID=$(cat "${CARD}/device" 2>/dev/null || echo "Unknown")
            else
                DEVICE_ID="Unknown"
            fi
            
            echo "    {" >> $TEMP_FILE
            echo "      \"index\": $INDEX," >> $TEMP_FILE
            echo "      \"name\": \"$NAME\"," >> $TEMP_FILE
            echo "      \"device_id\": \"$DEVICE_ID\"," >> $TEMP_FILE
            echo "      \"recommended_intensity\": 18" >> $TEMP_FILE
            echo "    }" >> $TEMP_FILE
            
            INDEX=$((INDEX+1))
        done
    fi
fi
echo "  ]," >> $TEMP_FILE

# Detect OpenCL availability
echo "  \"opencl_available\": $(command -v clinfo &> /dev/null && echo "true" || echo "false")," >> $TEMP_FILE

# Include algorithm data with recommended settings
echo "  \"algorithms\": [" >> $TEMP_FILE
cat >> $TEMP_FILE << 'EOL'
    {
      "name": "ethash",
      "display_name": "Ethash",
      "description": "Used by Ethereum Classic (ETC) and other cryptocurrencies",
      "cpu_supported": false,
      "nvidia_supported": true,
      "amd_supported": true,
      "intel_supported": true,
      "dev_fee": 0.65,
      "difficulty": "Medium",
      "recommended_for": ["NVIDIA", "AMD"]
    },
    {
      "name": "randomx",
      "display_name": "RandomX",
      "description": "Used by Monero (XMR) and other privacy-focused coins",
      "cpu_supported": true,
      "nvidia_supported": true,
      "amd_supported": true,
      "intel_supported": true,
      "dev_fee": 0.85,
      "difficulty": "Low",
      "recommended_for": ["CPU"]
    },
    {
      "name": "kawpow",
      "display_name": "KawPoW",
      "description": "Used by Ravencoin (RVN) and MeowCoin (MEWC)",
      "cpu_supported": false,
      "nvidia_supported": true,
      "amd_supported": true,
      "intel_supported": true,
      "dev_fee": 0.85,
      "difficulty": "Medium",
      "recommended_for": ["NVIDIA", "AMD"]
    },
    {
      "name": "autolykos2",
      "display_name": "Autolykos v2",
      "description": "Used by Ergo (ERG)",
      "cpu_supported": false,
      "nvidia_supported": true,
      "amd_supported": true,
      "intel_supported": true,
      "dev_fee": 1.00,
      "difficulty": "High",
      "recommended_for": ["NVIDIA"]
    }
EOL
echo "  ]," >> $TEMP_FILE

# Include mining pool recommendations
echo "  \"recommended_pools\": [" >> $TEMP_FILE
cat >> $TEMP_FILE << 'EOL'
    {
      "algorithm": "ethash",
      "pools": [
        {"name": "2Miners ETC", "url": "etc.2miners.com:1010", "notes": "Popular ETC pool with low fees"},
        {"name": "NiceHash", "url": "daggerhashimoto.usa.nicehash.com:3353", "notes": "Mine ETH algorithm for BTC payouts"}
      ]
    },
    {
      "algorithm": "randomx",
      "pools": [
        {"name": "2Miners XMR", "url": "xmr.2miners.com:2222", "notes": "Reliable Monero pool with regular payouts"},
        {"name": "MoneroOcean", "url": "gulf.moneroocean.stream:10128", "notes": "Auto-switching to most profitable coin"}
      ]
    },
    {
      "algorithm": "kawpow",
      "pools": [
        {"name": "2Miners RVN", "url": "rvn.2miners.com:6060", "notes": "Large Ravencoin pool with good stability"},
        {"name": "MeowCoin", "url": "pool.meowcoin.org:3444", "notes": "Official MeowCoin mining pool"}
      ]
    },
    {
      "algorithm": "autolykos2",
      "pools": [
        {"name": "HeroMiners Ergo", "url": "ergo.herominers.com:10250", "notes": "Established Ergo pool with good dashboard"},
        {"name": "WoolyPooly", "url": "pool.woolypooly.com:3100", "notes": "Multi-coin pool with consistent payouts"}
      ]
    }
EOL
echo "  ]" >> $TEMP_FILE

# Close the JSON object
echo "}" >> $TEMP_FILE

# Output the JSON result
cat $TEMP_FILE