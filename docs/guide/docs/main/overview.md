---
id: overview
title: Main Concepts
---

## Bot Types

A bot is simply a computer program that uses conversations as its main user interface. We call these interfaces **Conversational User Interfaces** (CUI). 

### Dumb Bots

A bot can be **dumb** meaning it doesn't understand much about conversations). Such chatbots are rules-based and usually rely heavily on pre-populated responses (e.g. buttons) or one-word answers. The data which they receive from the user rarely influences responses and the bot simply moves to the next step after a response.

The beauty of this type of bot is that it is cheaper, easy to implement, 99% effective and solves issues fast. This is because they are built with a specific workflow in mind and once a user understands what the goal of the bot is, s/he can easily use the bot for this goal.

### Smart Bots

The description **smart** means that the bot can understand language and communicate in a human-like way. Such bots can extract useful information from conversations like dates, amounts, and locations.

Such bots are indispensable as they can harvest additional data from the user. They can be used to broach abstract concepts such as gauging the sentiment and mood of the user. They can also help the streamlining of conversations by harvesting as much information as is possible from the user statement, making conversations shorter and more concise.

While you can develop both kinds of bots with Botpress, you will benefit most if you're trying to build a smart bot.

## Anatomy of a bot

A bot is pretty simple:

1. It receives messages from Messaging **Channels**
2. It **processes** these messages to understand, translate or escalate them
3. It **decides** on what to respond to the user

#### Lifecycle

![High-Level Diagram](assets/hld.png)




The red dots are the developer extension points. These indicate where code can be injected to customize the bot.

### Channels

A channel is a module that allows your bot to send and receive messages from a specific chat platform (Your website, Facebook Messenger, Telegram, etc.).

> In Botpress, channels are installed and configured individually and locally, giving you full control over the data that is transmitted between your bot and the chat platforms. Botpress does not proxy the messages to a 3rd party service as Microsoft Bot Framework does.

Behind the scenes, Botpress implements a queuing mechanism that processes ingoing and outgoing messages sequentially. If a message fails to be processed or sent for some reason, the message will be retried before raising an error to the developer and bot administrator.

### Processing

Messages received from messaging channels are then processed. During processing, Botpress extracts data from the text sent by a chat channel user. This data is processed in the following ways:

#### NLU

**Natural Language Understanding** (or **NLU**) involves your bot processing the messages received from the chat platforms, which are pure unstructured text, and transforming them into structured data that your bot will be able to work with. The main tasks the NLU engine does is:

- **Intent Recognition**: recognizing what the user wants.
- **Entity Extraction**: extracting structured information from messages like dates, time, cities, names, and more.
- **Slot tagging**: identify necessary **parameters** to fulfill given task.
- **Language Identification**: knowing in which language the user is writing.

All of the above will help you create more natural and pleasurable conversations.

#### HITL

**Human In The Loop** allows a real person to replace the chatbot. This may be in response to the user's request for assistance by a human being or may be triggered by some pre-programmed condition which, when met, redirects the bot user to a human assistant.

Such an intervention is necessary and indeed crucial as it is common for a chatbot to misunderstand the data being fed to it by the user.

#### Translation

In most cases, a chatbot is built using a single language, for example, English. To reduce bot development times, Botpress offers multi-language support for users with a Pro license. This means that the same bot can be used by people who speak different languages by using in-built translation tools. 

### Dialog Manager

Once you’ve received some text from a chat platform and transformed that text into structured data, the next component to be involved is the Dialog Manager (or DM). The role of the DM is to **decide** what the bot should do or say next.

Although the Dialog Manager could theoretically be implemented as a bunch of “If” and “Else” statements, this technique does not scale well in practice, because the unpredictability of natural dialogs increases the complexity of this kind of state machine exponentially.

Botpress solves this problem by combining an extensible Visual Flow Editor with a powerful Decision Engine Manager, which abstracts and eliminate the real complexity behind such State Machines.

#### Visual Flow Editor

This interface allows you to pre-define what the bot says to a user and how the chatbot processes and reacts to the user's response.

#### Decision Engine

This powerful component decides whether to follow the next step as dictated by the flow editor or give an alternate response, for example, a FAQ from the QnA module or a warning for profane language.

> **Upcoming**: The Botpress core team is currently working on adding statistical decisions to the Dialog Manager, which will allow you to create even more natural experiences while also simplifying development.

## Content

Now that the Dialog Manager has decided that your bot should reply with a certain message, there are a couple of pieces of information required before the message can be sent out to the user

The bot needs to know the kind of message it should send and how that message is going to be rendered on the different chat platforms.

That is what Content Elements are for. A Content Element can be seen as a structured object that holds information about what to say (for instance, the text phrase that will be displayed to the user), and a Content Renderer is a function that transforms that structured object into a platform-specific message (for example making some of the response text bold or italicized).

The purpose of a Content Renderer is to allow developers to specify how the same information should behave (i.e., be displayed) on the different chat platforms.

## Extension Points

Botpress allows for customization by injecting your self-written code. The two main ways to customize Botpress in this way are by using **actions** and **hooks**.

**Actions** are functions that are called by the Dialog Manager (in the context of a conversation) to retrieve data, call external services, or implement custom reply logic.

**Hooks** are snippets of code that always get executed in the context they are located in. For example, snippets in the `on_server_start` directory get executed when Botpress Server starts.

#### File Structure

```bash
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
│ ├── modules <1> # shared actions across all bots
│ ├── ui-admin <2> # lifecycle hooks (custom code)
│ ├── ui-studio # configuration across all bots
│ └── # etc... mostly auto-generated by installed modules
│
└── modules
├── nlu.tgz
├── webchat.tgz
└── # etc..
```

## Modules

A module is an extra component outside of the Botpress Core itself that you can install in your bot to add new features to Botpress. Every bot uses modules in a way since almost everything in Botpress is a module. 

This architecture allows for maximum flexibility and freedom for developers. It also ensures that any customizations are applied without affecting the smooth running of the Botpress Core.

## Complete overview of the Event Engine

This is a complete overview of the components implied in processing an event (ex: a message sent by a user). It is mostly informational, and you won't use most of these components directly. We have included it only to give you an insight into the bigger picture of the components involved and how they interact.

[![Event engine](assets/event_enginev2.2.png)](assets/event_enginev2.2.png)

