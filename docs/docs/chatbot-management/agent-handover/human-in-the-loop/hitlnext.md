---
id: hitlnext
title: HITL Next
---

--------------------

:::caution
This module is **not** compatible with the Converse API
:::

This revamped HITL works on **all existing and future channels (except the Converse API)**. It supports all features of its predecessor and a few more :

- Single-agent one login only
- Human handoff from any workflow
- Real-time agent interface
- Agent notes
- End-user profile
- Configurable transfer and assignment messages
- Message templates
- Basic queuing and assignent system
- Basic labeling

However, unlike its predecessor, this module only allows you to view conversations that have been paused by Botpress during a workflow using an action. As such, an agent cannot monitor live conversations between the chatbot and a user.

## Requirements

This module uses the `channel-web` to display conversations, so make sure it's enabled.

## Setup

Turn on HITL-next on the module management page of your Botpress Admin.
![Enable Module](https://user-images.githubusercontent.com/104075132/224081700-d507c3fb-ffad-49ff-a078-b783f954115c.png)

You can also enable the module directly in your `botpress.config.json` file as shown [here](/enterprise/user-management-and-security/role-based-access-control/collaborators).

## Agent Interface

The Studio interface has three main sections:

- **Handoffs:** a list of all conversation handoffs created by users by triggering the handoff action.
- **Conversation:** conversations between the chatbot and user. The agent can chat with a user once the conversation is assigned.
- **Contact Details:** where an agent sees user profile, agent notes, and tags.

![Agent Interface](/assets/agent-interface.png)

## Agent Profile

For an agent's name and avatar to display to users, they can configure their profile as follows:
1. In the Admin, click the avatar icon at the top right corner.
1. Select the **Update Profile** option. Then, fill in the boxes:
  1. **First Name**
  1. **Last Name**
  1. **Profile Picture**.

![Agent profile](/assets/agent-profile.png)

## Handoffs

The module ships with a `Handoff` [action](https://botpress.com/docs/main/code#actions) that you can use wherever you want in your workflows. To add such an action, select a node in a workflow, and hit the **+** below **on enter**, then choose the **handoff** action.

![Handoff Action](/assets/handoff-action.png)

Every time that node is triggered, the **Handoffs** section shows a new pending handoff in the list. By clicking a user, you can see a preview of the conversation. On the user side, your chatbot automatically sends a transfer message. This message is [customizable](#advanced-features-and-customization).

![Tranfer Message](/assets/transfer-message.png)

### Handoff Assignation and Resolution

To pick a handoff and start conversing with the end-user, an agent first needs to set themselves *Online** at the top right corner of the Agent Interface. This simple feature allows agents or coordinators to oversee conversations while offline. It is also handy when your team implements any auto-assignation rule.

![Online](/assets/online.gif)

Once online, an agent can click on any handoff item and click on the **Assign to Me** button top right corner of the conversation section. When a conversation is transferred to an agent, your chatbot will automatically send a message to the user. This message is [customizable](#advanced-features-and-customization).

![Assign Message](/assets/assign-message.png)

:::note
There is no limit on how many handoffs an agent can handle at once. A good practice would be to limit to 3.
:::

Once the discussion with the user is over, an agent can hand back the control to the Chatbot by simply clicking the **Resolve** button.

### User Profile

When a handoff item is selected, user variables are displayed in the user profile section. You can set user variables in any workflow using the built-in `SetVariable` action with the `user` scope. For more details, head to the [variables docs](https://botpress.com/docs/overview/quickstart/conversation-studio).

The displayed user name is a user variable. Set `fullName` as a user variable for it to show up in the user profile.

![User profile](/assets/user-profile.png)

### Agent Notes

A simple but powerful tool for collaboration over time, notes are associated with underlying conversations and not with the handoff item itself, making them persist from one handoff to another.

![Agent Notes](/assets/comments.png)

## Advanced Features and Customization

Here are the most commonly used module configurations. You can check out the [module configuration file](https://github.com/botpress/botpress/blob/master/modules/hitlnext/src/config.ts) for all options.

To set any of those configurations, you'll first need to open up the `hitlnext.json` in the **Code Editor** section of your Conversation Studio.

![Module Configuration](/assets/hitl-config.png)

Below is the raw configuration file available on path `...\data\global\config\hitlnext.json`:

```json
{
  "$schema": "../../assets/modules/hitlnext/config.schema.json",
  "agentSessionTimeout": "10m",
  "autoComplete": {
    "trigger": ":",
    "shortcuts": []
  },
  "messageCount": 10,
  "defaultUsername": false,
  "tags": [],
  "enableConversationDeletion": false,
  "transferMessage": {
    "en": "You are being transferred to an agent.",
    "fr": "Vous êtes transféré à un agent."
  },
  "assignMessage": {
    "en": "You have been assigned to our agent {{agentName}}.",
    "fr": "Vous avez été assigné à notre agent(e) {{agentName}}."
  }
}
```

### Transfer and Assignation Messages

To change **Transfer message** (default being `You are being transferred to an agent.`), change the `transferMessage` json object. You can also translate the message as follows:

```json
"transferMessage": {
  "en": "I'm tranfering you to our support team.",
  "de": "Ich schicke dich zur Unterstützung."
}
```

:::note
These changes will be applied when you either disable your chatbot and re-enable it or restart your Botpress server.
:::

The same technique applies to **Assignation Message**. Note that you can optionnally use the `agentName` variable.

### Message Templates

If your team of agents often uses the same set of answers, the `autoComplete` configuration can store pre-written messages. They are a handy shortcut for agents, and you can add as many as you want. 

Here is how they show up in the Agent Interface:

![Shortcuts](/assets/shortcuts.png)

Before adding a message template, choose a `trigger` character that will open up the templates list. In this example, we will use "**:**". Then, for each of your messages, add a `name` (appears on the left of each template, used to filter down the list as the agent types) and a `value` (the actual message that Botpress will paste in the composer). To summarize, configuration for the example above would look as follows:

```json
"autoComplete": {
  "trigger": ":",
  "shortcuts": [
    {
      "name": "hi",
      "value": "Hello you, I'm your kind agent, here to help you with whatever questions you might have."
    },
    {
      "name": "qa",
      "value": "Did I answer all of your questions properly, is there anything else I can help you with today?"
    },
    {
      "name": "bye",
      "value": "Thank you for trusting us, have a wonderful day."
    }
  ]
}
```

### Handoff Labels

Handoff labels are useful for agents to categorize handoffs before resolution so that in future handoffs, agents can quickly understand the last conversation with an agent. Labels are also useful when analyzing resolved handoffs, either for quality assurance or for reporting. 

![Labels](/assets/labels.png)

:::info
You can add as many as you want, but a good practice is to start with a small number of labels and add new ones when necessary. 
:::

**Example:**

```bash
"tags": ["shipping", "warranty","complaints"]
```
