FROM ubuntu:22.04 as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    wget \
    tar \
    ca-certificates

# Download and extract the latest SRBMiner release
WORKDIR /build
RUN wget -q -O /tmp/srbminer.tar.gz https://github.com/doktor83/SRBMiner-Multi/releases/download/2.8.0/SRBMiner-Multi-2-8-0-Linux.tar.gz && \
    mkdir -p /tmp/extract && \
    tar -xf /tmp/srbminer.tar.gz -C /tmp/extract && \
    cp -r /tmp/extract/SRBMiner-Multi-2-8-0 /build/SRBMiner-Multi && \
    echo "2.8.0" > /build/current_version.txt


FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    jq \
    wget \
    tar \
    unzip \
    ca-certificates \
    libcurl4 \
    libjansson4 \
    libgomp1 \
    openssl \
    ocl-icd-libopencl1 \
    cron \
    supervisor \
    tzdata \
    nodejs \
    npm \
    binutils \
    file \
    lsof \
    && rm -rf /var/lib/apt/lists/*

# Create necessary directories
RUN mkdir -p /srbminer /srbminer/config /srbminer/bin /srbminer/scripts /srbminer/backups /srbminer/www /etc/supervisor/conf.d

# Copy files from the builder stage
COPY --from=builder /build/SRBMiner-Multi /srbminer/bin/SRBMiner-Multi
COPY --from=builder /build/current_version.txt /srbminer/current_version.txt

# Copy scripts and configuration files
COPY scripts/ /srbminer/scripts/
COPY supervisord.conf /etc/supervisor/conf.d/
COPY supervisord.conf /etc/supervisor/supervisord.conf
COPY minimal.conf /etc/supervisor/minimal.conf

# Web UI files
COPY www/index.html /srbminer/www/
COPY www/setup.html /srbminer/www/
COPY www/styles.css /srbminer/www/
COPY www/api.js /srbminer/www/

# Make scripts executable
RUN chmod +x /srbminer/scripts/*.sh

# Create log files
RUN touch /var/log/srbminer.log /var/log/health-check.log /var/log/miner-update.log /var/log/web-ui.log

# Create miner user for better security
RUN useradd -r -s /bin/bash -d /srbminer miner && \
    chown -R miner:miner /srbminer /var/log

# Create supervisor run directory
RUN mkdir -p /var/run/supervisor && \
    chmod 777 /var/run/supervisor

# Define healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7000/api/summary || exit 1

# Expose API port and Web UI port
EXPOSE 7000 8080

# Set entrypoint
ENTRYPOINT ["/srbminer/scripts/entrypoint.sh"]