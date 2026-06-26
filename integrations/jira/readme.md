# Botpress Jira Software Integration

This integration allows you to connect your Botpress chatbot with Jira Software, a popular platform for project management and issue tracking. With this integration, you can search, create, update, and transition issues, list projects, find Jira users, and post issue comments through the comments channel.

This version supports the Jira OAuth setup wizard. If you are testing the OAuth build, the setup flow should offer **Connect with OAuth** and **Use an API Token**.

For more detailed instructions on how to set up and use the Botpress Jira Software integration, please refer to our documentation.

## Prerequisites

Before enabling the Botpress Jira Software Integration, please ensure that you have the following:

- A Botpress cloud account.
- Access to a Jira Software account.
- For OAuth setup: permission to authorize Jira access from your Atlassian account.
- For manual setup: an API token generated from your Atlassian account.

## Enable Integration

To enable the Jira Software integration in Botpress, follow these steps:

- Access your Botpress admin panel.
- Navigate to the “Integrations” section.
- Locate the Jira Software integration and click on "Install Integration".
- In the setup wizard, select **Connect with OAuth** to authorize Botpress with Atlassian.
- If your Atlassian account has access to multiple Jira sites, select the site this integration should use.
- Alternatively, select **Use an API Token** and provide your Jira host, Atlassian account email, and API token.
- Finish the setup.

## Usage

Once the integration is enabled, you can start using Jira from your Botpress chatbot. The integration offers the following actions:

- **Issues**: `searchIssues` (JQL with cursor pagination), `countIssues`, `pickIssue`, `getIssue`, `newIssue`, `newIssues` (batch up to 50), `updateIssue`, `assignIssue`, `deleteIssue`, `addAttachment`, `getIssueTransitions`, `transitionIssue`
- **Projects**: `listProjects`, `listProjectStatuses`, `listIssueTypes` (per project)
- **Users**: `findUser`, `findAllUsers`

To post comments to Jira issues, send text messages through the `issueComments` channel with the target `issueKey` conversation tag.

To upload an image or file to a Jira issue, call `addAttachment` with an `issueKey`, `filename`, and either a `fileUrl` or base64-encoded `data`.

To move an issue through its workflow, first call `getIssueTransitions` for that issue to discover valid transition IDs, then pass one to `transitionIssue`.

> Issue search uses Atlassian's `POST /rest/api/3/search/jql` endpoint (replacing the deprecated `/rest/api/3/search` retired in May 2025). Pagination is cursor-based — pass the `nextToken` from the previous response to fetch the next page. Use `countIssues` if you only need a total.

For more detailed information and examples, refer to the Botpress documentation or the Jira Software documentation for configuring the integration.

## Limitations

Remember that Jira's administrative limits also apply to the use of the API.

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvement, please submit them via the project’s issue tracker. Pull requests are also appreciated.

Enjoy the seamless project management integration between Botpress and Jira Software!
