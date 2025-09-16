# Loops Integration

## Configuration

- **API Key - Required:** can be retrieved at [Settings > API > Generate API key](https://app.loops.so/settings?page=api]).
- **Webhooks Signing Secret - Required:** [Settings > Webhooks > Signing Secret](https://app.loops.so/settings?page=webhooks). Available only to people with Loops' beta access.

## How to use

### Actions
**Send transactional emails:** \
To send transactional emails using this integration, a template must first be [published](https://loops.so/docs/transactional/guide). The ID of this template as well as the values of its data variables must then be passed as inputs to the `Send Transactional Email` action.

***Attachments:*** to include attachments, files must first be [uploaded to the workspace](https://botpress.com/docs/api-reference/files-api/how-tos/creating-files) and made available to the integration by adding the following to the Files API call:

```ts
await client.uploadFile({
    accessPolicies: ['integrations'],
    // Rest of the fields
})
```

There are currently no actions implemented for users to upload their own files, so the only viable use case currently is sending templates.

### Events
This integration currently supports events related to sent emails (via Botpress or not). Some events, such as an email being opened or a link in the email being clicked, only support campaign or Loop emails. See [Loops' official event docs](https://loops.so/docs/webhooks#email-events) for more information.