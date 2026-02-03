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

## Events

In order to enable events for the integration a board id must be provided in the configuration.

To find your board id, open the webpage for your trello board and add ".json" to the end of the URL. For example,

- `trello.com/b/Ab12cD43/my-trello-board` **->** `trello.com/b/Ab12cD43/my-trello-board.json`

The id of the board should be 24 characters long consisting of letters and numbers.

## Limitations

- Trello API rate limits apply.

- Some Trello paid features may not be available.

[Trello - API Introduction]: https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/

## Migration from 1.x.x to 2.x.x

- Replace "Move Card Up" action with "Move Card Down" actions (and vice versa) as the directions were reversed to match the visual displacement of the cards on Trello.
- Replace "Board List" action with "Get All Boards"
- Replace "Board Read" action with "Get Board By ID"
- Replace "List List" action with "Get Lists In Board"
- Replace "List Read" action with "Get List By ID"
- Replace "Card Create" action with "Create New Card"
- Replace "Card Update" action with "Update Card"
- Replace "Card Delete" action with "Delete Card"
- Replace "Card List" action with "Get Cards In List"
- Replace "Card Read" action with "Get Card By ID"
- Replace "Board Member List" action with "Get All Board Members"
- Replace "Board Member Read" action with "Get Member By ID Or Username"
- Replace "Card Member List" action with "Get All Card Members"
- Replace "Card Member Read" action with "Get Member By ID Or Username"
- Redefine the following properties in any "Create Card" actions
  - Member IDs (formerly "Members")
  - Label IDs (formerly "Labels")
- Redefine the following properties in any "Update Card" actions
  - "Card Name" (formerly "Name")
  - "Card Body" (formerly "Body Text")
  - "Lifecycle Status" (formerly "Closed State")
  - "Completion Status" (formerly "Complete State")
  - "Member IDs To Add" (formerly "Members To Add")
  - "Member IDs To Remove" (formerly "Members To Remove")
  - "Label IDs To Add" (formerly "Labels To Add")
  - "Label IDs To Remove" (formerly "Labels To Remove")
- Adjust the following events since their output data structure have changed
  - "updateCard" event
  - "commentCard" event
  - "updateComment" event
  - "deleteComment" event
  - "createCheckItem" event
  - "updateCheckItem" event
  - "deleteCheckItem" event
  - "updateCheckItemStateOnCard" event
