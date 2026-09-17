#!/usr/bin/env bash

set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
fixture_dir=$(mktemp -d)
trap 'rm -rf "$fixture_dir"' EXIT
mkdir -p "$fixture_dir/bin" "$fixture_dir/state"

cat >"$fixture_dir/bin/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail

url="${*: -1}"
method=GET
for ((i = 1; i <= $#; i++)); do
  if [[ "${!i}" == --request ]]; then
    next=$((i + 1))
    method="${!next}"
  fi
done
printf '%s %s\n' "$method" "$url" >>"$MOCK_STATE/calls"

case "$method $url" in
  "GET http://coolify/api/v1/applications/web")
    printf '{"docker_registry_image_name":"ghcr.io/marekh19/zebabu-web","destination_id":7,"fqdn":"https://dev.zebabu.com","status":"running:healthy"}\n'
    ;;
  "GET http://coolify/api/v1/applications/migration")
    if [[ -f "$MOCK_STATE/stop" ]]; then
      polls=$(cat "$MOCK_STATE/stop-polls" 2>/dev/null || printf 0)
      printf '%s\n' "$((polls + 1))" >"$MOCK_STATE/stop-polls"
      if ((polls > 0)) && [[ "$MOCK_SCENARIO" != stop_timeout ]]; then
        status=exited:unhealthy
      else
        status=running:healthy
      fi
    elif [[ "$MOCK_SCENARIO" == health_timeout ]]; then
      status=running:unhealthy
    else
      status=running:healthy
    fi
    if [[ "$MOCK_SCENARIO" == orphan ]]; then
      tag=migration-previous
    else
      tag=placeholder
    fi
    printf 'STATE %s\n' "$status" >>"$MOCK_STATE/calls"
    printf '{"docker_registry_image_name":"ghcr.io/marekh19/zebabu-web","docker_registry_image_tag":"%s","destination_id":7,"fqdn":"","status":"%s"}\n' "$tag" "$status"
    ;;
  "PATCH http://coolify/api/v1/applications/"*) ;;
  "POST http://coolify/api/v1/deploy?uuid=migration&force=false")
    printf '{"deployments":[{"deployment_uuid":"migration-deploy"}]}\n'
    ;;
  "POST http://coolify/api/v1/deploy?uuid=web&force=false")
    printf '{"deployments":[{"deployment_uuid":"web-deploy"}]}\n'
    ;;
  "GET http://coolify/api/v1/deployments/migration-deploy")
    if [[ "$MOCK_SCENARIO" == deployment_timeout ]]; then
      printf '{"status":"in_progress"}\n'
    elif [[ "$MOCK_SCENARIO" == migration_failure ]]; then
      printf '{"status":"failed"}\n'
    else
      printf '{"status":"finished"}\n'
    fi
    ;;
  "GET http://coolify/api/v1/deployments/web-deploy")
    printf '{"status":"finished"}\n'
    ;;
  "POST http://coolify/api/v1/applications/migration/stop?docker_cleanup=false")
    if [[ "$MOCK_SCENARIO" == stop_failure ]]; then
      exit 22
    fi
    touch "$MOCK_STATE/stop"
    ;;
  "GET https://dev.zebabu.com/health/ready") ;;
  *)
    printf 'Unexpected request: %s %s\n' "$method" "$url" >&2
    exit 1
    ;;
esac
MOCK

cat >"$fixture_dir/bin/sleep" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
chmod +x "$fixture_dir/bin/curl" "$fixture_dir/bin/sleep"

run_case() {
  local scenario="$1" expected_result="$2"
  rm -f "$fixture_dir/state/"*
  if env PATH="$fixture_dir/bin:$PATH" MOCK_STATE="$fixture_dir/state" MOCK_SCENARIO="$scenario" \
    COOLIFY_API_URL=http://coolify COOLIFY_API_TOKEN=test COOLIFY_CONFIG_API_TOKEN=test \
    COOLIFY_APP_UUID=web COOLIFY_MIGRATION_APP_UUID=migration \
    GITHUB_SHA=1111111111111111111111111111111111111111 \
    bash "$repo_root/scripts/deploy-coolify.sh" >"$fixture_dir/output" 2>&1; then
    result=success
  else
    result=failure
  fi

  if [[ "$result" != "$expected_result" ]]; then
    printf '%s: expected %s, got %s\n' "$scenario" "$expected_result" "$result" >&2
    cat "$fixture_dir/output" >&2
    exit 1
  fi

  if [[ "$scenario" == success ]]; then
    local stop_line exited_line web_line
    stop_line=$(rg -n 'POST http://coolify/api/v1/applications/migration/stop' "$fixture_dir/state/calls" | head -1 | cut -d: -f1)
    exited_line=$(rg -n 'STATE exited:unhealthy' "$fixture_dir/state/calls" | head -1 | cut -d: -f1)
    web_line=$(rg -n 'POST http://coolify/api/v1/deploy\?uuid=web' "$fixture_dir/state/calls" | head -1 | cut -d: -f1)
    [[ -n "$stop_line" && -n "$exited_line" && -n "$web_line" && "$stop_line" -lt "$exited_line" && "$exited_line" -lt "$web_line" ]]
    [[ $(cat "$fixture_dir/state/stop-polls") -ge 2 ]]
    rg -q 'GET https://dev.zebabu.com/health/ready' "$fixture_dir/state/calls"
  elif [[ "$scenario" == orphan ]]; then
    ! rg -q 'POST http://coolify/api/v1/deploy\?' "$fixture_dir/state/calls"
  else
    ! rg -q 'POST http://coolify/api/v1/deploy\?uuid=web' "$fixture_dir/state/calls"
    rg -q 'POST http://coolify/api/v1/applications/migration/stop' "$fixture_dir/state/calls"
  fi
  printf '%s: passed\n' "$scenario"
}

run_case success success
run_case stop_failure failure
run_case stop_timeout failure
run_case migration_failure failure
run_case health_timeout failure
run_case deployment_timeout failure
run_case orphan failure
