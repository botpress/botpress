# Hello World

This integration is a template with a single action.

> Describe the integration's purpose.

## Configuration

This integration does not need a configuration.

> Explain how to configure your integration and list prerequisites `ex: accounts, etc.`.
> You might also want to add configuration details for specific use cases.

## Usage

To use, call the action `helloWorld`. This action will greet the user.

> Explain how to use your integration.
> You might also want to include an example if there is a specific use case.

## Limitations

The `helloWorld` action has a max name size limit of 2^28 - 16 characters (the max javascript string size).

> List the known bugs.
> List known limits `ex: rate-limiting, payload sizes, etc.`
> List unsupported use cases.

## Changelog

- 0.1.0: Implemented `helloWorld` action.

> If some versions of your integration introduce changes worth mentionning (breaking changes, bug fixes), describe them here. This will help users to know what to expect when updating the integration.

### Integration publication checklist

- [ ] The register handler is implemented and validates the configuration.
- [ ] Title and descriptions for all schemas are present in `integration.definition.ts`.
- [ ] Events store `conversationId`, `userId` and `messageId` when available.
- [ ] Implement events & actions that are related to `channels`, `entities`, `user`, `conversations` and `messages`.
- [ ] Events related to messages are implemented as messages.
- [ ] When an action is required by the bot developer, a `RuntimeError` is thrown with instructions to fix the problem.
- [ ] Bot name and bot avatar URL fields are available in the integration configuration.
