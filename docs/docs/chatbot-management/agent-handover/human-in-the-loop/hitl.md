---
id: hitl
title: HITL
---

--------------------

:::note
A new, more feature-rich version of HITL. You can try it today. See docs [here](/chatbot-management/agent-handover/human-in-the-loop/hitlnext).
:::

Botpress allows you to build a powerful tool for autonomous communication with your users. However, some use cases are hard to implement as a chatbot workflow or are not yet supported by your chatbot. 

Botpress offers a human handoff system,  which transfers a conversation from your chatbot to an agent. The agent can view these conversations in the **HITL** module (short for Human-in-the-Loop). Human-in-the-Loop is currently supported on `channel-web` and `channel-messenger` only.

Once you have this module installed, you will be able to:

1. Pause a user's conversation with the bot manually or programmatically.
2. Alert your agents that a conversation requires attention.
3. As an agent, you will be able to continue the conversation via the admin panel.
4. Resume conversation with the bot.

## Pausing Conversation

There are several ways you can pause the conversation:

- From the HITL module, toggling the pause button.
 
![Pause button](/assets/hitl_pause.png)

- By performing an API-request:

`let base = EXTERNAL_URL + '/api/v1/bots/' + botId + '/mod/hitl`

- POST {$base}/sessions/{$id}/pause
- POST {$base}/sessions/{$id}/unpause
- POST {$base}/channel/{$channel}/user/{\$userId}/pause
- POST {$base}/channel/{$channel}/user/{\$userId}/unpause

For example:

```js
POST http://localhost:3000/api/v1/bots/welcome-bot/mod/hitl/sessions/13/pause
```

## Alerting Agents

There are a number of ways to alert your agents of a paused conversation, an email, a call to an external API or, as in the example below, via a notification in the admin-panel:

```js
const { botId } = event
const message = user.first_name + ' wants to talk to a human'
bp.notifications.create(botId, { message, level: 'info', url: '/modules/hitl' })
```

The agent can then navigate to the appropriate conversation and take over the conversation from the bot. 

:::
In the latest versions, the notification bell is absent from the UI, so you will need to make a component to get the info from the notifications table or use a sendEmail action after pausing the conversation to alert agents.

## Resuming the Conversation

Once the agent has finished assisting the user, they can unpause the conversation, which hands it back to the chatbots control.

It is also possible for the user to unpause the conversation by calling the API endpoint.

## Displaying a Users Name

You may want to display the name of your chatbot user instead of the random string displayed in the HITL module studio interface.You can store the name in user attributes using an action. For example, if you have already captured the first name and last name in a user variable you can set as follows:

```js
  const setUserFullName = async () => {
    user.full_name = user.first_name + ' ' + user.last_name
    bp.users.setAttributes(event.channel, event.target, user)
  }

  return setUserFullName()
```
