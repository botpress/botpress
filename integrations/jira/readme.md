# Botpress Jira Software Integration

This integration allows you to connect your Botpress chatbot with Jira Software, a popular platform for project management and issue tracking. With this integration, you can search, create, update, and transition issues, list projects, find Jira users, and post issue comments from your chatbot.

To set up the integration, you will need to provide your **host**, **email**, and **API token** credentials. Once the integration is set up, you can use the built-in actions to manage issues and projects, and use the issue comments channel to post comments.

For more detailed instructions on how to set up and use the Botpress Jira Software integration, please refer to our documentation.

## Prerequisites

Before enabling the Botpress Jira Software Integration, please ensure that you have the following:

- A Botpress cloud account.
- Access to a Jira Software account.
- API token generated from your Jira Software account.

## Enable Integration

To enable the Jira Software integration in Botpress, follow these steps:

- Access your Botpress admin panel.
- Navigate to the “Integrations” section.
- Locate the Jira Software integration and click on "Install Integration".
- Provide the required API token, host, and email configuration details.
- Save the configuration.

## Usage

Once the integration is enabled, you can start using Jira from your Botpress chatbot. The integration offers the following actions:

- **Issues**: `searchIssues` (JQL with cursor pagination), `countIssues`, `pickIssue`, `getIssue`, `newIssue`, `newIssues` (batch up to 50), `updateIssue`, `assignIssue`, `deleteIssue`, `getIssueTransitions`, `transitionIssue`
- **Projects**: `listProjects`, `listProjectStatuses`, `listIssueTypes` (per project)
- **Users**: `findUser`, `findAllUsers`

To post comments to Jira issues, send text messages through the `issueComments` channel with the target `issueKey` conversation tag.

To move an issue through its workflow, first call `getIssueTransitions` for that issue to discover valid transition IDs, then pass one to `transitionIssue`.

> Issue search uses Atlassian's `POST /rest/api/3/search/jql` endpoint (replacing the deprecated `/rest/api/3/search` retired in May 2025). Pagination is cursor-based — pass the `nextToken` from the previous response to fetch the next page. Use `countIssues` if you only need a total.

For more detailed information and examples, refer to the Botpress documentation or the Jira Software documentation for configuring the integration.

## Limitations

Remember that Jira's administrative limits also apply to the use of the API.

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvement, please submit them via the project’s issue tracker. Pull requests are also appreciated.

Enjoy the seamless project management integration between Botpress and Jira Software!
