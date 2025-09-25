# Webhook Message

This integration serves as a template for receiving events through a webhook and creating messages for them, as well as sending messages through an external API.

> Describe the integration's purpose.

## Configuration

To use this integration, you will need to manually subscribe your integration to an external service webhook.
You will also have to provide a webhookUrl configuration to send outgoing messages to.

> Explain how to configure your integration and list prerequisites `ex: accounts, etc.`.
> You might also want to add configuration details for specific use cases.

## Usage

Send messages through the `webhook` channel to send them through the external webhookUrl you configured.
Receive messages through the integration's incoming webhook handler. Received messages have to contain:

```typescript
userId: string
conversationId: string
text: string
```

> Explain how to use your integration.
> You might also want to include an example if there is a specific use case.

## Limitations

Only text messages are supported for outgoing messages.

> List the known bugs.
> List known limits `ex: rate-limiting, payload sizes, etc.`
> List unsupported use cases.

## Changelog

- 0.1.0: Incoming webhook and outgoing channel.

> If some versions of your integration introduce changes worth mentionning (breaking changes, bug fixes), describe them here. This will help users to know what to expect when updating the integration.

### Integration publication checklist

- [ ] The register handler is implemented and validates the configuration.
- [ ] Title and descriptions for all schemas are present in `integration.definition.ts`.
- [ ] Events store `conversationId`, `userId` and `messageId` when available.
- [ ] Implement events & actions that are related to `channels`, `entities`, `user`, `conversations` and `messages`.
- [ ] Events related to messages are implemented as messages.
- [ ] When an action is required by the bot developer, a `RuntimeError` is thrown with instructions to fix the problem.
- [ ] Bot name and bot avatar URL fields are available in the integration configuration.
