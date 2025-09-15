# Loops Integration

## Configuration

- **API Key - Required:** can be retrieved at [Settings > API > Generate API key](https://app.loops.so/settings?page=api]).

## How to use

- **Actions:** to send transactional emails using this integration, a template must first be [published](https://loops.so/docs/transactional/guide). The ID of this template as well as the values of its data variables must then be passed as inputs to the `Send Transactional Email` action.

- **Events:** this integration currently supports events related to sent emails (via Botpress or not). Some events, such as an email being opened or a link in the email being clicked, only support campaign or Loop emails. See [Loops' official event docs](https://loops.so/docs/webhooks#email-events) for more information.