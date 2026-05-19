# Grafana Client Architecture

## Why two generated clients?

Grafana is migrating its entire API from a legacy HTTP API (`/api/...`) to a
Kubernetes-style API (`/apis/...`). The migration is happening incrementally —
different resources reach stability at different times.

This project uses two generated clients to reflect that reality:

| Client                   | Spec                                                                 | Covers                             |
| ------------------------ | -------------------------------------------------------------------- | ---------------------------------- |
| `grafana-k8s-client/`    | `specs/grafana-dashboard-k8s.json` + `specs/grafana-folder-k8s.json` | Dashboards, Folders                |
| `grafana-legacy-client/` | `specs/grafana-legacy.json`                                          | Alerts, Notifications, Datasources |

### Why is the legacy client still used for alerts and notifications?

The K8s-style replacements exist but are not yet stable:

- **Alert rules** → `rules.alerting.grafana.app/v0alpha1` — alpha, schema can break in any release
- **Notification policies** → `notifications.alerting.grafana.app/v1beta1` — beta, more stable but not a guaranteed contract yet

The deprecation hints visible in `alerts.ts`, `notifications.ts`, and
`datasources.ts` are intentional. They serve as a signal: these files are the
ones to update when their K8s API equivalents graduate to `v1`.

## Namespace resolution

Grafana Cloud uses a per-stack namespace in the format `stacks-{stackId}` (e.g.
`stacks-1623217`). This is **not** `"default"`.

The namespace is automatically discovered at runtime by calling
`GET /api/frontend/settings` on the Grafana instance. This happens once per
K8s API call and requires no extra configuration. If the call fails, an error
is thrown before any K8s request is made.

---

## How to regenerate when the API changes

### Prerequisites

```bash
nvm use       # or: source "$HOME/.nvm/nvm.sh"
```

### Step 1 — Re-fetch the spec(s) that changed

**Grafana K8s API specs** (requires a valid service account token):

```bash
TOKEN="your-grafana-service-account-token"
BASE="https://your-stack.grafana.net"

curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  "$BASE/openapi/v3/apis/dashboard.grafana.app/v1" \
  -o specs/grafana-dashboard-k8s.json

curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  "$BASE/openapi/v3/apis/folder.grafana.app/v1" \
  -o specs/grafana-folder-k8s.json
```

**Legacy HTTP API spec** (fetched from Grafana's public GitHub):

```bash
curl -s "https://raw.githubusercontent.com/grafana/grafana/main/public/api-merged.json" \
  -o specs/grafana-legacy.json
```

### Step 2 — Regenerate the client(s)

```bash
# Regenerate the K8s client (dashboards + folders)
npx @hey-api/openapi-ts \
  -i ./specs/grafana-dashboard-k8s.json ./specs/grafana-folder-k8s.json \
  -o ./src/grafana-k8s-client \
  -c @hey-api/client-fetch

# Regenerate the legacy client (alerts, notifications, datasources)
npx @hey-api/openapi-ts \
  -i ./specs/grafana-legacy.json \
  -o ./src/grafana-legacy-client \
  -c @hey-api/client-fetch
```

### Step 3 — Fix compile errors

```bash
npm run check:type
```

Breaking changes in the spec will surface here as type errors in the `clients/`
wrappers. Fix them in the wrapper file — the `actions/` layer and
`integration.definition.ts` should not need to change.

---

## Migrating a client from legacy to K8s

When a resource's K8s API graduates to `v1`, follow these steps:

1. **Find the new spec endpoint** — check the discovery document:

   ```bash
   curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
     "https://your-stack.grafana.net/openapi/v3" | python3 -m json.tool | grep "grafana.app"
   ```

2. **Fetch the new spec** and save it to `specs/`.

3. **Add the spec to the K8s generation command** (Step 2 above).

4. **Update the relevant `clients/` wrapper** to import from `grafana-k8s-client`
   and use `k8sClient(config)` instead of `legacyClient(config)`.

5. **Run `npm run check:type`** and fix any errors.

6. The `grafana-legacy-client` will still be regenerated with the full legacy spec —
   unused functions there are harmless.

---

## File map

```
specs/
  grafana-dashboard-k8s.json   ← source spec for dashboards (K8s v1)
  grafana-folder-k8s.json      ← source spec for folders (K8s v1)
  grafana-legacy.json          ← source spec for everything else (legacy HTTP)

src/
  grafana-k8s-client/          ← generated — do not edit manually
  grafana-legacy-client/       ← generated — do not edit manually

  clients/
    config.ts                  ← k8sClient() and legacyClient() factories
    dashboards.ts              ← uses grafana-k8s-client
    folders.ts                 ← uses grafana-k8s-client
    alerts.ts                  ← uses grafana-legacy-client (migrate when rules.alerting.grafana.app/v1 ships)
    notifications.ts           ← uses grafana-legacy-client (migrate when notifications.alerting.grafana.app/v1 ships)
    datasources.ts             ← uses grafana-legacy-client (no K8s equivalent yet)
```
