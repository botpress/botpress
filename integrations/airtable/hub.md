# Botpress Airtable Integration

This integration allows you to connect your Botpress chatbot with Airtable, a popular cloud-based database and collaboration platform. With this integration, you can easily manage your Airtable bases, tables, and records directly from your chatbot.

## Setup

To set up the integration, you will need to provide your Airtable `accessToken`, `baseId`, and `endpointUrl` (Optional). Once the integration is set up, you can use the built-in actions to manage your Airtable data.

For more detailed instructions on how to set up and use the Botpress Airtable integration, please refer to our documentation.

### Prerequisites

Before enabling the Botpress Airtable Integration, please ensure that you have the following:

- A Botpress cloud account.
- `accessToken`, `baseId`, and `endpointUrl` (Optional) generated from Airtable.

### Enable Integration

To enable the Airtable integration in Botpress, follow these steps:

1. Access your Botpress admin panel.
2. Navigate to the “Integrations” section.
3. Locate the Airtable integration and click on “Enable” or “Configure.”
4. Provide the required `accessToken`, `baseId`, and `endpointUrl` (Optional).
5. Save the configuration.

### Scope and resources/access of the Personal Access Token

Personal Access Token act as the user account granting access, with the following limitations:

- Scope: What actions the token can perform.
- Resources/access: Which bases and workspaces the token can access. Tokens may be granted access to individual or all bases/workspaces. These can be listed using the list bases endpoint.

For example, to update a record in a base via the API, the user who granted the token must have editor access to the base. In addition, the token must have both the correct scope (**data.records:write**) and the base added as a resource.

For personal access tokens, scopes and resources/access are configured individually from **/create/tokens**.
