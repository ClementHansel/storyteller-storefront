#!/usr/bin/env bash
# =============================================================================
# Bambu Silver Storefront - Auto Deploy Script
# =============================================================================
# Automatically pulls latest changes from main branch and rebuilds the Docker
# container if new commits are detected. Designed to run via cron every 5 minutes.
#
# Usage:
#   */5 * * * * /home/ubuntu/bambusilver/vps-auto-deploy.sh
#
# Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8
# =============================================================================

set -uo pipefail

# --- Configuration ---
DEPLOY_DIR="/home/ubuntu/bambusilver"
LOG_DIR="${DEPLOY_DIR}/logs"
LOG_FILE="${LOG_DIR}/deploy.log"
LOCK_FILE="/tmp/bambusilver-deploy.lock"
BRANCH="main"

# --- Ensure log directory exists ---
mkdir -p "${LOG_DIR}"

# --- Logging helper ---
log() {
  local level="$1"
  shift
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] $*" >> "${LOG_FILE}"
}

# --- Flock-based mutex (Requirement 2.8) ---
# If another instance is already running, exit immediately without performing
# any operations.
exec 200>"${LOCK_FILE}"
if ! flock -n 200; then
  exit 0
fi

# --- Change to project directory ---
cd "${DEPLOY_DIR}" || {
  log "ERROR" "Cannot access deploy directory: ${DEPLOY_DIR}"
  exit 1
}

# --- Record current git revision (Requirement 2.2) ---
BEFORE_REV=$(git rev-parse HEAD 2>/dev/null) || {
  log "ERROR" "Failed to read current git revision"
  exit 1
}

# --- Git pull from main branch (Requirement 2.2, 2.7) ---
PULL_OUTPUT=$(git pull origin "${BRANCH}" 2>&1) || {
  log "ERROR" "Git pull failed: ${PULL_OUTPUT}"
  exit 0
}

# --- Record new git revision after pull ---
AFTER_REV=$(git rev-parse HEAD 2>/dev/null) || {
  log "ERROR" "Failed to read git revision after pull"
  exit 1
}

# --- Compare revisions (Requirements 2.3, 2.4) ---
if [ "${BEFORE_REV}" = "${AFTER_REV}" ]; then
  log "SKIP" "No changes detected (rev: ${BEFORE_REV:0:8})"
  exit 0
fi

# --- Rebuild and restart container (Requirement 2.3) ---
log "INFO" "Changes detected (${BEFORE_REV:0:8} → ${AFTER_REV:0:8}). Rebuilding..."

BUILD_OUTPUT=$(docker compose up -d --build 2>&1) || {
  # Build failure: log error, retain previous container (Requirement 2.6)
  log "ERROR" "Build failed (rev: ${AFTER_REV:0:8}): ${BUILD_OUTPUT}"
  exit 0
}

log "SUCCESS" "Deploy complete (${BEFORE_REV:0:8} → ${AFTER_REV:0:8})"
