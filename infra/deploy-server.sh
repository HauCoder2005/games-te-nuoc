#!/usr/bin/env bash
set -euo pipefail
: "${SERVER_HOST:?Cần SERVER_HOST}"
: "${SERVER_USER:?Cần SERVER_USER}"
: "${SERVER_DIR:?Cần SERVER_DIR}"
ssh "${SERVER_USER}@${SERVER_HOST}" "cd '${SERVER_DIR}' && git pull --ff-only && docker compose --env-file infra/.env -f infra/docker-compose.yml up -d --build"
