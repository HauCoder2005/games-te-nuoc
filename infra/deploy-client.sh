#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"
: "${BUCKET:?Cần BUCKET}"
: "${CF_DISTRIBUTION_ID:?Cần CF_DISTRIBUTION_ID}"
: "${VITE_SERVER_URL:?Cần VITE_SERVER_URL}"
npm run build -w apps/client
aws s3 sync apps/client/dist/ "s3://$BUCKET/" --exclude index.html --cache-control 'public,max-age=3600' --delete
while IFS= read -r path; do
  key="${path#apps/client/dist/}"
  aws s3 cp "$path" "s3://$BUCKET/$key" --cache-control 'public,max-age=31536000,immutable'
done < <(find apps/client/dist/assets -type f | grep -E -- '-[A-Za-z0-9_-]{8,}\.(js|css|woff2?)$' || true)
aws s3 cp apps/client/dist/index.html "s3://$BUCKET/index.html" --content-type text/html --cache-control no-cache
aws cloudfront create-invalidation --distribution-id "$CF_DISTRIBUTION_ID" --paths /index.html
