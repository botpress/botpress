# Planhat

Integrate your Botpress bot with Planhat to manage customer success data, track user engagement, and automate customer workflows.

> This integration allows your bot to interact with Planhat's customer success platform.

## Configuration

To configure this integration, you will need:

- A Planhat account
- API credentials from Planhat

> Detailed configuration instructions will be added as the integration is developed.

## Usage

This integration provides actions to interact with Planhat's API.

> Specific usage instructions and examples will be added as actions are implemented.

## Limitations

> Known limitations and rate limits will be documented as the integration is developed.

## Changelog

- 0.1.0: Initial scaffolding.

> Future versions will document changes and new features.

### Integration publication checklist

- [ ] The register handler is implemented and validates the configuration.
- [ ] Title and descriptions for all schemas are present in `integration.definition.ts`.
- [ ] Events store `conversationId`, `userId` and `messageId` when available.
- [ ] Implement events & actions that are related to `channels`, `entities`, `user`, `conversations` and `messages`.
- [ ] Events related to messages are implemented as messages.
- [ ] When an action is required by the bot developer, a `RuntimeError` is thrown with instructions to fix the problem.
- [ ] Bot name and bot avatar URL fields are available in the integration configuration.
