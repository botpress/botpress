# Integration Title

> Describe the integration's purpose.

## Configuration

> Explain how to configure your integration and list prerequisites `ex: accounts, etc.`.
> You might also want to add configuration details for specific use cases.

## Usage

> Explain how to use your integration.
> You might also want to include an example if there is a specific use case.

## Limitations

> List the known bugs.
> List known limits `ex: rate-limiting, payload sizes, etc.`
> List unsupported use cases.

## Changelog

> If some versions of your integration introduce changes worth mentionning (breaking changes, bug fixes), describe them here. This will help users to know what to expect when updating the integration.

### Integration publication checklist

- [ ] The register handler is implemented and validates the configuration.
- [ ] Title and descriptions for all schemas are present in `integration.definition.ts`.
- [ ] Events store `conversationId`, `userId` and `messageId` when available.
- [ ] Implement events & actions that are related to `channels`, `entities`, `user`, `conversations` and `messages`.
- [ ] Events related to messages are implemented as messages.
- [ ] When an action is required by the bot developer, a `RuntimeError` is thrown with instructions to fix the problem.
- [ ] Bot name and bot avatar URL fields are available in the integration configuration.
