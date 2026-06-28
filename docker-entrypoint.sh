#!/bin/sh
# Runtime environment injection script
# Generates /usr/share/nginx/html/env-config.js at container start
# Iterates over VITE_* environment variables and writes them as window.__ENV__ properties
# This enables configuration changes without rebuilding the Docker image.

set -e

ENV_FILE="/usr/share/nginx/html/env-config.js"

{
  echo "// Runtime environment configuration - generated at container start"
  echo "window.__ENV__ = {"

  separator=""
  for var in $(env | grep "^VITE_" | sort); do
    name="${var%%=*}"
    value="${var#*=}"
    # Escape backslashes and double quotes in the value
    escaped_value=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf '%s  "%s": "%s"' "$separator" "$name" "$escaped_value"
    separator=",
"
  done

  echo ""
  echo "};"
} > "$ENV_FILE"

echo "[entrypoint] env-config.js generated with VITE_* variables"
