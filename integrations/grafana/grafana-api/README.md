# Grafana API Specs

Source specs for the two generated clients. Re-fetch these when the Grafana API changes, then run `pnpm run generate`.

## grafana-legacy.json

Grafana's legacy HTTP API (`/api/...`). Covers alerts, notifications, datasources, and contact points.

- **Swagger UI**: https://editor.swagger.io/?url=https://raw.githubusercontent.com/grafana/grafana/main/public/api-merged.json
- **Re-fetch**:
  ```sh
  curl -s "https://raw.githubusercontent.com/grafana/grafana/main/public/api-merged.json" \
    -o src/gen/specs/grafana-legacy.json
  ```

## grafana-dashboard-k8s.json / grafana-folder-k8s.json

Grafana's Kubernetes-style API (`/apis/...`). These must be fetched from a live Grafana instance using a service account token.

- **Discovery** (lists all available K8s API groups):
  ```sh
  curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
    "https://your-stack.grafana.net/openapi/v3" | python3 -m json.tool | grep "grafana.app"
  ```
- **Re-fetch**:

  ```sh
  TOKEN="your-grafana-service-account-token"
  BASE="https://your-stack.grafana.net"

  curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
    "$BASE/openapi/v3/apis/dashboard.grafana.app/v1" \
    -o src/gen/specs/grafana-dashboard-k8s.json

  curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
    "$BASE/openapi/v3/apis/folder.grafana.app/v1" \
    -o src/gen/specs/grafana-folder-k8s.json
  ```

## Why two clients?

Grafana is migrating from the legacy HTTP API to a Kubernetes-style API incrementally. Dashboards and folders have stable K8s `v1` APIs; alerts and notifications are still alpha/beta and use the legacy client. See [src/gen/README.md](../README.md) for the full architecture doc.
