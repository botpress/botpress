# TODO: Not done by Adrian yet

# Integration Title

Connect with BambooHR to get employee information and more.

## Configuration

Get subdomain from your URL: `https://subdomain.bamboohr.com`.

2 options:

- OAuth, redirected to link to sign in
- API Key, generate at `https://subdomain.bamboohr.com/settings/permissions/api.php` (you must be an admin)

## Usage

- Listen on events to fire changes when a new employee is added or updated.
- Use actions to get employee or company information for your bot.

## Limitations

- Only supports employee information. No support for files, benefits, time off, etc.

## Changelog

v1.0.0

### Integration publication checklist

- [x] The register handler is implemented and validates the configuration.
- [x] Title and descriptions for all schemas are present in `integration.definition.ts`.
- [x] Events store `conversationId`, `userId` and `messageId` when available.
- [x] Implement events & actions that are related to `channels`, `entities`, `user`, `conversations` and `messages`.
- [x] Events related to messages are implemented as messages.
- [x] When an action is required by the bot developer, a `RuntimeError` is thrown with instructions to fix the problem.
- [x] Bot name and bot avatar URL fields are available in the integration configuration.
