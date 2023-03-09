---
id: what-is-botpress
title: What is Botpress?
---

---

:::info Quick Definition
Botpress is an open-source platform for developers to build high-quality digital assistants.
:::

At its core, Botpress is a tool to simplify building chatbots for developers. The platform puts together the boilerplate code and infrastructure you need to get a chatbot up and running and gives a complete dev-friendly platform that ships with all the tools you need to build, deploy, and manage production-grade chatbots in record time. The platform includes:

- Built-in [Natural Language Processing](/building-chatbots/language-understanding/supported-languages) tasks such as [intent classification](/building-chatbots/language-understanding/intents/slots), spell checking, [entity extraction](/building-chatbots/language-understanding/entities/system-entities), and many others;
- A visual [Conversation Studio](/overview/quickstart/conversation-studio) to design multi-turn conversations and workflows;
- An [emulator](/building-chatbots/testing-&-debugging/emulator) & a [debugger](/building-chatbots/testing-&-debugging/debugger) to simulate conversations and debug your chatbot;
- Support for popular messaging channels like [Slack](/messaging-channels/direct-integrations/slack), [Telegram](/messaging-channels/direct-integrations/telegram), [Microsoft Teams](/messaging-channels/direct-integrations/microsoft-teams), [Facebook Messenger](/messaging-channels/direct-integrations/facebook-messenger), and an embeddable web chat;
- An SDK and Code Editor to extend the capabilities;
- [Post-deployment](/going-to-production/deploy/linux) tools like analytics, [human handoff](/chatbot-management/agent-handover/human-in-the-loop/hitlnext), and more...

## With Botpress, You Can...

**Automate Workflows**: Do you want to automate your chatbot? Gather the potential user information you need. And... there you go!

**Support your customer 24/7**: You know how it works. If there's nobody when your user needs help, they will find a new place to do (almost) the same. Having a chatbot that answers your user's questions while you're asleep... What a dream!

**Allow employees to self-serve**: Self-serve is something people _want_. Let's look at a classic example: resetting your password. Sometimes, you have to ask your system administrator or any IT person reachable (and maybe this person is sleeping too) because you have been logged out of your email. The truth is you could just ask in Slack for a password reset and do it yourself.

**Create a conversational interface for an application**: Some applications are better delivered with a GUI, but in other cases, a conversational interface is simply a better option. It’s just natural for someone to ask in plain English rather than browsing an interface. For example, they ask:

**Example:**
`Hey, I am looking for [insert what they want here].`

## Chatbot Types

A chatbot is a computer program that uses conversations as its user interface (Conversational User Interface or CUI in short). There are two types of chatbots, namely, **Rule-Based Chatbots** and **A.I. Based Chatbots**. Let's explore them in more detail.

### Rule-Based Chatbots

A chatbot can be **rule-based** meaning it doesn't understand much about conversations. Such a chatbot usually relies heavily on pre-populated responses (e.g., buttons) or one-word answers. User messages rarely influence responses. The chatbot moves to the next step after receiving a user message or prompts the user to give a pre-configured reply (e.g., a button or keyword).

This type of chatbot is cheaper, easy to implement, 99% effective, and solves issues fast. It has these characteristics because the developer built the chatbot for a specific workflow. Once a user understands the chatbot's goal, s/he can easily use the chatbot for this goal.

### AI-Based Chatbots

These chatbots can understand language and communicate in a human-like way. They can extract useful information from conversations like dates, amounts, and locations.

These chatbots are indispensable when you need to harvest all available data from the user's message, like dates, quantities, user's mood, and amounts. They can also help streamline conversations by gathering as much information as possible from user responses, making conversations shorter and more concise.

While you can use Botpress to develop both kinds of chatbots, you will benefit most from the framework if you're trying to build an A.I.-based chatbot.

## Anatomy of a chatbot

A chatbot is quite simple:

1. It receives messages from Messaging **channels**.
2. It **processes** these messages to understand, translate, or escalate underlying information.
3. It **decides** how to respond to the user
   ![High-Level Diagram](/assets/hld.png)
   The red dots are the developer extension points. These indicate where a chatbot developer can inject code to customize their chatbot.

### Channels

Think of a channel in the context of communication. Using this definition, we can describe a channel as any chat platform which connects your chatbot to the intended user, for example, Facebook Messenger. Botpress provides pre-built modules which allow your chatbot to send and receive messages from the following chat platforms:

- Website Embedded Chat
- Facebook Messenger
- Twilio
- Slack
- Telegram
- Microsoft Teams
- Sunshine Conversations
- Vonage

:::note
In Botpress, channels are installed and configured individually and locally, giving you complete control over the data transmitted between your chatbot and the chat platforms. Botpress does not proxy the messages to a 3rd party service.
:::

Behind the scenes, Botpress implements a queuing mechanism that processes ingoing and outgoing messages sequentially. If a message fails to be processed or sent for some reason, Botpress will retry the message processing sequence before raising an error to the developer and chatbot administrator.

### Processing

Messages received from messaging channels are then processed. During processing, Botpress extracts data from the text sent by a chat channel user and processes it in the following ways:

#### NLU

**Natural Language Understanding** (or **NLU**) allows your chatbot to process messages into structured data which your chatbot can understand. The main tasks of the NLU engine are:

- **Intent Classification**: recognizing what the user wants.
- **Entity Extraction**: extracting structured information from messages like dates, time, cities, names, and more.
- **Slot tagging**: identify necessary **parameters** to fulfill given tasks.
- **Language Identification**: knowing in which language the user is writing.
- **Spell Checking**: giving you one less thing to worry about by making sure your user's text input is spelt correctly by fixing typo and other errors.
- **Out of Scope Recognition**: identifying instances when a user says something that the chatbot cannot understand.

All of the above will help you create more natural and pleasurable conversations.

#### HITL

**Human In The Loop** allows a real person to replace the chatbot. This may be in response to the user's request for assistance by a person or may be triggered by a pre-programmed condition which, when met, redirects the chatbot user to a person.

Such an intervention is necessary and crucial as it is common for a chatbot to misunderstand the data being fed to it by the user. For instance, a user may say something out of the chatbot's scope or may present a response in a way that the developer hasn't train the chatbot to recognize.

#### Translation

A chatbot is built using a single language, for example, English. You can create two hooks and connect your bot to a language translation software that will allow the bot to translate languages supported by that software for incoming and outgoing messages. Please refer to the [Third party translations solution](https://github.com/botpress/solutions/tree/master/custom%20solutions/Third%20party%20translations) in our [Solutions Repository](https://github.com/botpress/solutions).

### Dialog Manager

Once you've received some text from a chat platform and transformed that text into structured data, the next component involved is the Dialog Manager (or DM). The role of the DM is to **decide** what the chatbot should do or say next.

Although the Dialog Manager could theoretically be a bunch of "If" and "Else" statements, this technique does not scale well in practice. Natural dialogs are unpredictable, which increases the complexity of such a state machine exponentially.

Botpress solves this problem by combining an extensible Visual Flow Editor with a powerful Decision Engine Manager, which significantly eliminates the complexity behind such State Machines.

#### Visual Flow Editor

This interface allows you to pre-define how the chatbot responds to a user in terms of the code it will execute and the messages it will display to the user.

#### Decision Engine

This robust component decides whether to follow the next step as dictated by the flow editor or give an alternate response, for example, a FAQ from the QnA module or a warning for profane language.

:::note Upcoming
The Botpress core team is currently working on adding statistical decisions to the Dialog Manager, which will allow you to create even more natural experiences while also simplifying development. For instance, if a user asks a question while interacting with a rules-based workflow, the chatbot will answer that question from the QnA module, then return to the workflow.
:::

### Extension Points

Botpress allows for customization by injecting your self-written code. The two main ways to customize Botpress in this way are [by using **actions** and **hooks**](/building-chatbots/flow-editor/actions).

**Actions** are called by the Dialog Manager (in the context of a conversation) to retrieve data, call external services, or implement custom reply logic.

**Hooks** are snippets of code that always get executed in the context they are located. For example, snippets in the `on_server_start` directory get executed when Botpress Server starts.

#### File Structure

```
bash
botpress-server
├── bp / bp.exe
│
└── data
│ │
│ ├── bots
│ │ └── name-of-your-bot
│ │ ├── bot.config.json # bot-specific configuration
│ │ ├── revisions.json # changelog of bot configurations
│ │ ├── actions <1>
│ │ │ └── custom-code-1.js
│ │ │ └── # etc...
│ │ ├── flows
│ │ └── # etc...(content elements, config, hooks, intents, entities, media, modules, qna)
│ │
│ |── global
│ | ├── actions <1> # shared actions across all bots
│ | ├── hooks <2> # lifecycle hooks (custom code)
│ | ├── botpress.config.json # configuration across all bots
│ | └── # etc... mostly auto-generated by installed modules
| |
│ └── assets
│ ├── modules <1> # assets related to activated modules
│ ├── ui-admin <2> # # assets related to the main admin user interface
│ ├── ui-studio # assets related to the studio user interface
│ └── # etc...
│
└── modules
├── nlu.tgz
├── webchat.tgz
└── # etc...
```

## Content

After the Dialog Manager has decided how your chatbot should reply to a specific message, the chatbot needs to know the text or other content of the response message and how it should render it on the target chat platform.

### Content Element

A Content Element is a structured object that holds information about what to say (for instance, the text phrase displayed to the user).

### Content Type

A Content Type defines the nature of what the chatbot sends. Examples are a text message, an image, and a card.

### Content Renderer

A Content Renderer is a function that transforms that structured object into a platform-specific message (for example, making some of the response text bold or italicized on Facebook Messenger).

The purpose of a Content Renderer is to allow developers to specify how the same information should behave (i.e., be displayed) on different chat platforms.

## Modules

A module is an extra component outside of the Botpress Core itself that you can install in your chatbot to add new features to Botpress. Every chatbot uses modules in a way since almost everything in Botpress is a module.

This modular architecture allows for maximum flexibility and freedom for developers. It also ensures that any customizations are applied without affecting the smooth running of the Botpress Core.

As a developer, you can create your own [custom module](/building-chatbots/developers/custom-modules) to add extra functionalities to your chatbot.

## Event Engine Overview

Below is a complete overview of the components implied in processing an event (ex: a message sent by a user). It is mostly informational, and you won't use most of these components directly. We have included it only to give you an insight into the bigger picture of the elements involved and how they interact.

![Event engine](/assets/event_enginev2.2.png)
