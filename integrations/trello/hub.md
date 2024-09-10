This integration allows you to connect your Botpress chatbot with Trello, a
popular project management platform. With this integration, you can easily
manage your projects and tasks directly from your chatbot.

To set up the integration, you will need to provide your **Trello API key** and
**Token**. Once the integration is set up, you can use the built-in actions to
create and update cards, add comments to cards, and more.

For more detailed instructions on how to set up and use the Botpress Trello
integration, please refer to our documentation.

## Prerequisites

Before enabling the Botpress Trello Integration, please ensure that you have the
following:

- A Botpress cloud account.

- Access to a Trello workspace.

- API key generated from Trello.

  - To generate an API key, you will need to create an application on Trello.
    Follow the official instructions here: [Trello - API Introduction].

- API token generated from Trello.
  - Once you have created your application, you may grant it access to one or
    several of your Trello workspaces. Trello will then generate the API token
    for you.

## Enable Integration

To enable the Trello integration in Botpress, follow these steps:

- Access your Botpress admin panel.

- Navigate to the “Integrations” section.

- Locate the Trello integration and click on “Enable” or “Configure.”

- Provide the required API key and API token.

- Save the configuration.

## Usage

Once the integration is enabled, you can start interacting with Trello from your
Botpress chatbot. The integration offers actions like `createCard`, `updateCard`,
`getMember`, `getBoardMembers` and `addComment` to manage tasks and users.

For more details and examples, refer to the Botpress and Trello documentation.

## Limitations

- Trello API rate limits apply.

- Some Trello paid features may not be available.

[Trello - API Introduction]: https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/
