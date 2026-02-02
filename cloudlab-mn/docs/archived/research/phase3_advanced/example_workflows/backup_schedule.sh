#!/bin/bash
#
# Backup Schedule Script for Emily Sovereign
#
# This script orchestrates automated backups with the following schedule:
# - Hourly ZFS snapshots (24-hour retention)
# - Daily Restic offsite backups (12-month retention)
# - Weekly backup verification
# - Monthly restore testing
#
# Usage: ./backup_schedule.sh [hourly|daily|weekly|monthly]

set -e

# Configuration
BACKUP_DIR="/var/backups/emily"
ZFS_DATASETS="zpool/data zpool/emily"
RESTIC_REPOSITORY="s3:https://s3.wasabisys.com/emily-backups"
RESTIC_PASSWORD_FILE="/etc/restic/password"
LOG_DIR="/var/log/emily-backup"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create directories
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# Logging function
log() {
    local level="$1"
    shift
    local message="$@"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_DIR/backup-$TIMESTAMP.log"
}

# Function to create ZFS snapshots
create_zfs_snapshots() {
    log INFO "Creating ZFS snapshots"
    
    for dataset in $ZFS_DATASETS; do
        local snapshot_name="$dataset@backup-$TIMESTAMP"
        
        # Create snapshot
        if zfs snapshot "$snapshot_name"; then
            log INFO "Created snapshot: $snapshot_name"
        else
            log ERROR "Failed to create snapshot: $snapshot_name"
            return 1
        fi
    done
    
    log INFO "ZFS snapshots created successfully"
}

# Function to clean up old ZFS snapshots
cleanup_old_snapshots() {
    local retention_hours="${1:-24}"
    log INFO "Cleaning up ZFS snapshots (retention: $retention_hours hours)"
    
    for dataset in $ZFS_DATASETS; do
        # List and delete old snapshots
        zfs list -t snapshot -o name -H "$dataset" | \
            grep "@backup-" | \
            while read snapshot; do
                # Extract timestamp
                snapshot_ts=$(echo "$snapshot" | grep -oP 'backup-\K\d+')
                
                if [ -n "$snapshot_ts" ]; then
                    snapshot_date=$(date -d "${snapshot_ts:0:8}" +%s 2>/dev/null || echo 0)
                    cutoff_date=$(date -d "$retention_hours hours ago" +%s)
                    
                    if [ "$snapshot_date" -lt "$cutoff_date" ]; then
                        log INFO "Deleting old snapshot: $snapshot"
                        zfs destroy "$snapshot" || log WARNING "Failed to delete snapshot: $snapshot"
                    fi
                fi
            done
    done
    
    log INFO "Old ZFS snapshots cleaned up"
}

# Function to run Restic backup
run_restic_backup() {
    log INFO "Starting Restic backup"
    
    # Export Restic environment
    export RESTIC_REPOSITORY
    export RESTIC_PASSWORD="$(cat $RESTIC_PASSWORD_FILE)"
    export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
    export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"
    
    # Check if repository exists
    if ! restic cat config &>/dev/null; then
        log INFO "Restic repository does not exist, initializing..."
        restic init || {
            log ERROR "Failed to initialize Restic repository"
            return 1
        }
    fi
    
    # Start timer
    start_time=$(date +%s)
    
    # Run backup
    log INFO "Backing up datasets: $ZFS_DATASETS"
    
    backup_dirs=""
    for dataset in $ZFS_DATASETS; do
        mountpoint=$(zfs list -H -o mountpoint "$dataset")
        if [ -d "$mountpoint" ]; then
            backup_dirs="$backup_dirs $mountpoint"
        fi
    done
    
    if restic backup $backup_dirs \
        --exclude-file="/etc/restic/excludes.txt" \
        --tag "emily" \
        --tag "automated" \
        --tag "$(date +%Y-%m-%d)" \
        --verbose \
        >> "$LOG_DIR/restic-backup-$TIMESTAMP.log" 2>&1; then
        
        backup_status="success"
    else
        backup_status="failed"
    fi
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    # Log result
    log INFO "Restic backup $backup_status (duration: ${duration}s)"
    
    if [ "$backup_status" != "success" ]; then
        log ERROR "Restic backup failed"
        return 1
    fi
    
    # Export metrics
    if [ -n "$PROMETHEUS_PUSHGATEWAY" ]; then
        curl --data-binary "backup_duration_seconds{type=\"restic\"} $duration" \
            "$PROMETHEUS_PUSHGATEWAY/metrics/job/backup" || true
    fi
    
    log INFO "Restic backup completed successfully"
}

# Function to verify backup
verify_backup() {
    log INFO "Verifying backup integrity"
    
    export RESTIC_REPOSITORY
    export RESTIC_PASSWORD="$(cat $RESTIC_PASSWORD_FILE)"
    
    # Check repository
    if restic check --read-data-subset=5% \
        >> "$LOG_DIR/restic-verify-$TIMESTAMP.log" 2>&1; then
        log INFO "Backup verification passed"
        return 0
    else
        log ERROR "Backup verification failed"
        return 1
    fi
}

# Function to prune old backups
prune_backups() {
    log INFO "Pruning old backups"
    
    export RESTIC_REPOSITORY
    export RESTIC_PASSWORD="$(cat $RESTIC_PASSWORD_FILE)"
    
    # Prune according to retention policy
    restic forget \
        --keep-hourly 24 \
        --keep-daily 30 \
        --keep-weekly 8 \
        --keep-monthly 12 \
        --keep-yearly 3 \
        --prune \
        >> "$LOG_DIR/restic-prune-$TIMESTAMP.log" 2>&1
    
    if [ $? -eq 0 ]; then
        log INFO "Backup pruning completed"
        return 0
    else
        log ERROR "Backup pruning failed"
        return 1
    fi
}

# Function to test restore
test_restore() {
    log INFO "Testing backup restore"
    
    export RESTIC_REPOSITORY
    export RESTIC_PASSWORD="$(cat $RESTIC_PASSWORD_FILE)"
    
    # Create temp directory
    temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT
    
    # Get latest snapshot
    latest_snapshot=$(restic snapshots --json | jq -r '.[0].id')
    
    if [ -z "$latest_snapshot" ]; then
        log ERROR "No snapshots found"
        return 1
    fi
    
    # Restore to temp directory
    if restic restore "$latest_snapshot" \
        --target "$temp_dir" \
        --tag "emily" \
        >> "$LOG_DIR/restic-restore-$TIMESTAMP.log" 2>&1; then
        
        log INFO "Backup restore test passed"
        return 0
    else
        log ERROR "Backup restore test failed"
        return 1
    fi
}

# Main function
main() {
    local operation="${1:-hourly}"
    
    log INFO "Starting $operation backup operation"
    
    case "$operation" in
        hourly)
            create_zfs_snapshots
            cleanup_old_snapshots 24
            ;;
        daily)
            create_zfs_snapshots
            run_restic_backup
            verify_backup
            ;;
        weekly)
            verify_backup
            prune_backups
            ;;
        monthly)
            test_restore
            ;;
        *)
            log ERROR "Unknown operation: $operation"
            echo "Usage: $0 [hourly|daily|weekly|monthly]"
            exit 1
            ;;
    esac
    
    log INFO "Backup operation completed successfully"
}

# Run main function
main "$@"
