---
layout: guide
---

Botpress allows you to build a quite powerful tool for communication with user.
But even with it there may be cases that are either impossible of very resource-consuming to implement and you may consider having an operator communicating certain users under some  conditions.

[@botpress/hitl](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-hitl) is designed to solve this issue (only supports messenger-channel for now).

Once you have this package installed (`npm install --save @botpress/hitl`) you'll be able to:

1. Pause conversation with bot
2. Allert agents that conversation requires attention
3. As an agent you'll be able to communicate with users through admin-panel
4. Resume conversation programmatically

# Pausing conversation

There are several ways you can pause conversation:
- from admin UI toggling appropriate button
- by performing API-requests:
  - POST /api/botpress-hitl/sessions/{$id}/pause
  - POST /api/botpress-hitl/sessions/{$id}/unpause
- programmatically by calling `bp.hitl.pause(platform, userId)` and `bp.hitl.unpause(platform, userId)`

# Allering agents

You may have different ways of notifying agents with emails or external API's and this is all possible. But we'll cover a simple case of notifying agent via notification in admin-panel:

```js
  const message = event.user.first_name + ' wants to talk to a human'
  bp.notifications.send({ message, level: 'info', url: '/modules/botpress-hitl' })
```

Agents can then navigate to appropriate conversation and start communication.

# Resuming conversation

Once they agents are done communicating with the user they can unpause conversation. But this can be implemented programmatically either to allow user unpause conversation himself like this: `bp.hitl.unpause(platform, userId)`

# Example

Check an example implementing HITL_START and HITL_STOP events: HITL_START pauses conversation, alerts agents and sends user a button allowing him to resume conversation with bot. HITL_STOP resumes conversation.

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

