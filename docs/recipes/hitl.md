---
layout: guide
---

Botpress allows you to build a powerful tool for autonomous communication with your users.
However there may be cases where it is difficult or very resource-consuming to implement a conversation flow within the bot. At this point you may consider having a human take over the conversation and continue to communicate with your user.

The [Human-in-the-Loop (@botpress/hitl)](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-hitl) module allows you to do just that! (It does only support messenger-channel for now).

Once you have this module installed (`npm install --save @botpress/hitl`) you will be able to:

1. Pause a users conversation with the bot
2. Alert your agents that a conversation requires attention
3. As an agent you will be able to continue the conversation via the admin-panel
4. Resume conversation with the bot

# Pausing conversation

There are several ways you can pause the conversation:
- from the admin-panel, toggling the appropriate button
- by performing an API-request:
  - POST /api/botpress-hitl/sessions/{$id}/pause
  - POST /api/botpress-hitl/sessions/{$id}/unpause
- programmatically by calling `bp.hitl.pause(platform, userId)` and `bp.hitl.unpause(platform, userId)`

# Alerting agents

There are a number of ways to alert your agents of a paused conversation, an email, a call to an external API or, as in the example below, via a notification in the admin-panel:

```js
  const message = event.user.first_name + ' wants to talk to a human'
  bp.notifications.send({ message, level: 'info', url: '/modules/botpress-hitl' })
```

The agent can then navigate to the appropriate conversation and take over the conversation from the bot.

# Resuming conversation

Once the agent is done communicating with the user, they can unpause the conversation. 

However it is possible for the user to unpause the conversation programmatically by triggering an an action that calls `bp.hitl.unpause(platform, userId)`

# Example

Below is an example implementing HITL_START and HITL_STOP events.

HITL_START pauses conversation the conversation with the bot, alerts the agents via the admin-panel and sends the user a button, allowing them to resume conversation with bot. HITL_STOP resumes conversation.

```js
bp.hear(/HITL_START/, (event, next) => {
  bp.messenger.sendTemplate(event.user.id, {
    template_type: 'button',
    text: 'Bot paused, a human will get in touch very soon.',
    buttons: [{ type: 'postback', title: 'Cancel request', payload: 'HITL_STOP' }]
  })

  bp.notifications.send({
    message: event.user.first_name + ' wants to talk to a human',
    level: 'info',
    url: '/modules/botpress-hitl'
  })
  bp.hitl.pause(event.platform, event.user.id)
})

bp.hear(/HITL_STOP/, (event, next) => {
  bp.messenger.sendText(event.user.id, 'Human in the loop disabled. Bot resumed.')
  bp.hitl.unpause(event.platform, event.user.id)
})
```

