# Botpress Grafana Integration

Monitor and manage your Grafana instance from a Botpress chatbot. Query metrics, manage dashboards, alert rules, folders, contact points, and notification policies through conversational actions.

## Setup

You will need a **Grafana username** and a **Service Account Token**.

### Prerequisites

- A Botpress cloud account
- A running Grafana instance
- A Grafana Service Account Token with sufficient permissions

### Enable Integration

1. In Grafana, go to **Administration → Service Accounts** and create a service account with the `Editor` role (or narrower scopes as needed).
2. Generate a token for that service account and copy it.
3. In Botpress, navigate to **Integrations** and find Grafana.
4. Enter your **Grafana username** and the **Service Account Token**.
5. Save the configuration.
