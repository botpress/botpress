---
id: hitlnext
title: HITL Next (beta)
---

This revamped HITL works on **all existing and future channels**. It supports all features of its predecessor and a few more :

- Multi-agents ( _enterprise edition only_ )
- Human handoff from any workflow
- Real-time agent interface
- Agent notes
- End-user profile
- Configurable transfer and assignment messages
- Message templates
- Basic queuing and assignent system
- Basic labeling
- Documented HTTP API (_coming soon_)
- Webhook integration (_coming soon_)

However, unlike its predecessor, this module only allows you to view conversations that have been paused by Botpress during a workflow using an action. As such, an agent cannot monitor conversations currently in progress between the chatbot and a user.

## Requirements

This module uses the `channel-web` to display conversations, so make sure it's enabled. Moreover, a multi-agent setup needs an enterprise license.

## Setup

Turn on HITL-next on the module management page of your Botpress admin.
![Enable Module](assets/hitl/enable-module.png)

You can also enable the module directly in your `botpress.config.json` file as shown [here](https://botpress.com/docs/main/module#enabling-or-disabling-modules)

## Agent Interface

The UI Studio interface has three main sections:

- **Handoffs** : A list of all conversation handoffs created by users by triggering the handoff action.
- **Conversation**: This shows conversations between the chatbot and user. The agent can chat with a user once the conversation is assigned.
- **Contact Details**: Where an agent sees user profile, agent notes, and tags.

![Agent Interface](assets/hitl/agent-interface.png)

## Adding agents

Revamped HITL allows multiple agents to collaborate on the platform. As a Botpress workspace administrator, you can invite agents the same way you would invite administrators or developers to your workspace. To do so, head to the `Collaborators` tab in your Botpress administration console, click add collaborator.

![Collaborators](assets/hitl/collaborators.png)

A dialog window will show up. Fill in your agent email and select `Agent` as role. Follow the instructions and send your agents the authentication information.

![Agent Collaborator](assets/hitl/agent-collaborator.png)

### Agent profile

For an agent's name and avatar to display to users, they can configure their profile by clicking the avatar icon on the top right corner of the administration interface and then selecting the `update profile` option. The following form dialog will show up.

![Agent profile](assets/hitl/agent-profile.png)

## Handoffs

The module ships with a `Handoff` [action](https://botpress.com/docs/main/code#actions) that you can use wherever you want in your workflows. To add such an action, select a node in a workflow, and hit the + below `on enter`, then choose the `handoff` action.

![Handoff Action](assets/hitl/handoff-action.png)

Every time that node is triggered, the Handoffs section will show a new pending handoff in the list. On selecting by clicking a user, you will be able to see a preview of the conversation. On the user side, your chatbot automatically sends a **transfer message**. This message is customizable, see [configuration](#advanced-features-and-customization) section.


![Tranfer Message](assets/hitl/transfer-message.png)

### Handoff assignation and resolution

To pick a handoff and start conversing with the end-user, an agent first needs to set himself/herself `online` in the top right corner of the Agent Interface. This simple feature allows agents or coordinators to oversee conversations while offline. It is also handy when your team implements any auto-assignation rule.

![Online](assets/hitl/online.gif)

Once online, an agent can click on any handoff item and click on the `assign to me` button top right corner of the conversation section. When a conversation is transferred to an agent, your chatbot will automatically send an **assignation message** to the user. This message is customizable, see [configuration](#advanced-features-and-customization) section.

![Assign Message](assets/hitl/assign-message.png)

> There is no limit on how many handoffs an agent can handle at once. A good practice would be to limit to 3.

Once the discussion with the user is over, an agent can hand back the control to the Chatbot by simply clicking the `resolve` button.

### User profile

When a handoff item is selected, user variables are displayed in the user profile section. You can set user variables in any workflow using the built-in `SetVariable` action with the `user` scope. For more details, head to the [variables docs](https://botpress.com/docs/main/memory#variables).

The displayed user name is a user variable. Set `fullName` as a user variable for it to show up in the user profile.

![User profile](assets/hitl/user-profile.png)

### Agent notes

A simple but powerful tool for collaboration over time, notes are associated with underlying conversations and not with the handoff item itself, making them persist from one handoff to another. In other words, with time, a user can have different handoff sessions with various agents, and agents can leave notes so future agents can see the additional context.

![Agent Notes](assets/hitl/comments.png)

## Advanced features and customization

Here are the most commonly used module configurations. You can check out the [module configuration file](https://github.com/botpress/botpress/blob/master/modules/hitlnext/src/config.ts) for all options.

To set any of those configurations, you'll first need to open up the `hitlnext.json` in the code editor section of your Botpress Studio.

![Module Configuration](assets/hitl/hitl-config.png)

Below is the raw configuration file available on path `...\data\global\config\hitlnext.json`

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

### Transfer and assignation messages

To change **Transfer message** (default being `You are being transferred to an agent`) and add a German translation for your German-speaking users, change the `transferMessage` json object to the desired translations.

```json
"transferMessage": {
  "en": "I'm tranfering you to our support team",
  "de": "Ich schicke dich zur Unterstützung"
}
```

These changes will be applied when you either disable your chatbot and re-enable it or restart your Botpress server.

The same technique applies to **Assignation Message**, but you have access to the `agentName` variable, which corresponds to the agent's full name, but its use is optional.

### Message templates

If your team of agents often uses the same set of answers, the `autoComplete` configuration can store these pre-written messages to take care of this task for you. They are a handy shortcut for agents, and you can add as many as you want. Here is how they show up in the Agent Interface :

![Shortcuts](assets/hitl/shortcuts.png)

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

Handoff labels are useful for agents to categorize handoffs before resolution so that in future handoffs, agents can quickly understand the last conversation with an agent. Labels are also useful when analyzing resolved handoffs, either for quality assurance or for reporting. You can add as many as you want, but a good practice is to start with a small number of labels and add new ones when necessary. Here is how they show up in the agent interface:

![Labels](assets/hitl/labels.png)

The three labels here are set in a simply json array as follows:

```bash
"tags": ["shipping", "warranty","complaints"]
```
