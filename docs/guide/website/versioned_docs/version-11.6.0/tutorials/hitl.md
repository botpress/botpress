---
id: version-11.6.0-hitl
title: Human in the loop
original_id: hitl
---

Botpress allows you to build a powerful tool for autonomous communication with your users.
However there may be cases where it is difficult or very resource-consuming to implement a conversation flow within the bot. At this point you may consider having a human take over the conversation and continue to communicate with your user.

The [Human-in-the-Loop (hitl)](https://github.com/botpress/botpress/tree/master/modules/.hitl) module allows you to do just that!

Human-in-the-Loop is currently supported on `channel-web` and `channel-messenger`.

Once you have this module installed, you will be able to:

1. Pause a user's conversation with the bot
2. Alert your agents that a conversation requires attention
3. As an agent you will be able to continue the conversation via the admin-panel
4. Resume conversation with the bot

## Pausing conversation

There are several ways you can pause the conversation:

- from the admin-panel, toggling the appropriate button
- by performing an API-request:
  - POST /mod/hitl/sessions/{$id}/pause
  - POST /mod/hitl/sessions/{$id}/unpause
  - POST /mod/hitl/channel/{$channel}/user/{$userId}/pause
  - POST /mod/hitl/channel/{$channel}/user/{$userId}/unpause

## Alerting agents

There are a number of ways to alert your agents of a paused conversation, an email, a call to an external API or, as in the example below, via a notification in the admin-panel:

```js
const message = event.user.first_name + ' wants to talk to a human'
bp.notifications.create({ message, level: 'info', url: '/modules/hitl' })
```

The agent can then navigate to the appropriate conversation and take over the conversation from the bot.

## Resuming conversation

Once the agent is done communicating with the user, they can unpause the conversation.

It is also possible for the user to unpause the conversation by calling the API endpoint.
