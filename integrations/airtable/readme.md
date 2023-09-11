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

## Usage

Once the integration is enabled, you can start using Airtable features from your Botpress chatbot. The integration offers several actions for interacting with Airtable, such as `getBaseTables`, `getTableRecords`, `createTable`, `updateTable`, `createRecord`, and `updateRecord`. These actions allow you to get tables and records from a base, create and update tables, and create and update records.

For more details and examples, refer to the Botpress and Airtable documentation.

## Limitations

- Free Plan Limits:
  - Records: Limited to **1,000 records per base**.
  - API: Limited to **1,000 API calls per month**.
  - Commenters: Limited to **50 commenters per workspace**.
  - Sync and extensions: Available on the **Team plan and above**. To continue using Airtable with higher limits, you can upgrade to the Team plan.
- Rate limiting: Airtable employs a number of safeguards against bursts of incoming traffic to help maximize its stability. The API is limited to **5 requests per second per base**. If you exceed this rate, you will receive a **429 status code** and will need to wait **30 seconds** before subsequent requests will succeed. Airtable may change the enforced API rate limits or enforce additional types of limits in their sole discretion, including tiered based on pricing plan. Upon receiving a 429 status code, API integrations should back-off and wait before retrying the API request. The official JavaScript client has built-in back-off and retry logic. If you anticipate a higher read volume, it is recommended to use a caching proxy.

## Contributing

Contributions are welcome! Please submit issues and pull requests.

Enjoy seamless helpdesk and customer support integration between Botpress and Airtable!
