#!/usr/bin/env bash

set -euo pipefail

for name in COOLIFY_API_URL COOLIFY_API_TOKEN COOLIFY_CONFIG_API_TOKEN COOLIFY_APP_UUID COOLIFY_MIGRATION_APP_UUID GITHUB_SHA; do
  if [[ -z "${!name:-}" ]]; then
    printf '%s is required\n' "$name" >&2
    exit 1
  fi
done

if [[ ! "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  printf 'GITHUB_SHA must be a full commit SHA\n' >&2
  exit 1
fi

api_url="${COOLIFY_API_URL%/}/api/v1"
web_image='ghcr.io/marekh19/zebabu-web'
migration_image='ghcr.io/marekh19/zebabu-migration'

get_resource() {
  curl --fail --silent --show-error --max-time 30 \
    --header "Authorization: Bearer $COOLIFY_CONFIG_API_TOKEN" \
    "$api_url$1"
}

set_image_tag() {
  local uuid="$1" tag="$2" body
  body=$(jq -nc --arg tag "$tag" '{docker_registry_image_tag: $tag}')
  curl --fail --silent --show-error --max-time 30 \
    --request PATCH \
    --header "Authorization: Bearer $COOLIFY_CONFIG_API_TOKEN" \
    --header 'Content-Type: application/json' \
    --data "$body" \
    "$api_url/applications/$uuid" >/dev/null
}

trigger_deployment() {
  local response
  response=$(curl --fail --silent --show-error --max-time 30 \
    --request POST \
    --header "Authorization: Bearer $COOLIFY_API_TOKEN" \
    "$api_url/deploy?uuid=$1&force=false")
  jq -er '.deployments[0].deployment_uuid' <<<"$response"
}

wait_for_deployment() {
  local uuid="$1" status
  for ((attempt = 0; attempt < 90; attempt++)); do
    status=$(get_resource "/deployments/$uuid" | jq -r '.status')
    case "$status" in
      finished) return 0 ;;
      failed | cancelled | cancelled-by-user)
        printf 'Coolify deployment %s ended with %s\n' "$uuid" "$status" >&2
        return 1
        ;;
    esac
    sleep 5
  done
  printf 'Timed out waiting for Coolify deployment %s\n' "$uuid" >&2
  return 1
}

wait_for_healthy_application() {
  local uuid="$1" status
  for ((attempt = 0; attempt < 60; attempt++)); do
    status=$(get_resource "/applications/$uuid" | jq -r '.status')
    if [[ "$status" == 'running:healthy' ]]; then
      return 0
    fi
    sleep 5
  done
  printf 'Coolify application %s did not become healthy\n' "$uuid" >&2
  return 1
}

web=$(get_resource "/applications/$COOLIFY_APP_UUID")
migration=$(get_resource "/applications/$COOLIFY_MIGRATION_APP_UUID")

if [[ $(jq -r '.docker_registry_image_name' <<<"$web") != "$web_image" ]] ||
  [[ $(jq -r '.docker_registry_image_name' <<<"$migration") != "$migration_image" ]]; then
  printf 'Coolify image names do not match the release images\n' >&2
  exit 1
fi

web_destination=$(jq -r '.destination.uuid // empty' <<<"$web")
migration_destination=$(jq -r '.destination.uuid // empty' <<<"$migration")
if [[ -z "$web_destination" || "$web_destination" != "$migration_destination" ]]; then
  printf 'Web and migration applications must share a Coolify destination\n' >&2
  exit 1
fi

if [[ -n $(jq -r '.fqdn // empty' <<<"$migration") ]]; then
  printf 'Migration application must not have a public domain\n' >&2
  exit 1
fi

printf 'Deploying migration image for %s\n' "$GITHUB_SHA"
set_image_tag "$COOLIFY_MIGRATION_APP_UUID" "$GITHUB_SHA"
migration_deployment=$(trigger_deployment "$COOLIFY_MIGRATION_APP_UUID")
wait_for_deployment "$migration_deployment"
wait_for_healthy_application "$COOLIFY_MIGRATION_APP_UUID"
printf 'Migrations completed\n'
if ! curl --fail --silent --show-error --max-time 30 \
  --request POST \
  --header "Authorization: Bearer $COOLIFY_API_TOKEN" \
  "$api_url/applications/$COOLIFY_MIGRATION_APP_UUID/stop?docker_cleanup=false" >/dev/null; then
  printf 'Could not stop the migration application; continuing web rollout\n' >&2
fi

printf 'Deploying web image for %s\n' "$GITHUB_SHA"
set_image_tag "$COOLIFY_APP_UUID" "$GITHUB_SHA"
web_deployment=$(trigger_deployment "$COOLIFY_APP_UUID")
wait_for_deployment "$web_deployment"
wait_for_healthy_application "$COOLIFY_APP_UUID"
curl --fail --silent --show-error --max-time 30 \
  https://dev.zebabu.com/health/ready >/dev/null

printf 'Web release is healthy\n'
