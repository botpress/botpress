---
id: version-11.0.1-overview
title: High-level Overview
original_id: overview
---

There are some concepts that you need to understand before you can build a chatbot using Botpress. On this page you will learn the most important ones and how they play together.

### Dumb vs Smart

A bot is simply a computer program that uses conversations as its main user interface. We call these interfaces **Conversational User Interfaces** (CUI). A bot can be **dumb** (don't understand much about conversations) or **smart** (understand language and communicate in a human-like way).

While you can develop both kind of bots with Botpress, you will really benefit most of it if you're trying to build a smart bot.

### Anatomy of a bot

A bot is pretty simple:

1. It receives messages from Messaging **Channels**
2. It **processes** these messages to understand, translate or escalate them
3. It **decides** on what to respond back to the user

##### Lifecycle

![High-Level Diagram](assets/hld.png)

<br/>

In red are the developer extension points, i.e. where you will be able to inject code to customize the bot.

### Channels

A channel is a module that allows your bot to send and receive messages from a specific chat platform (Slack, Facebook Messenger, Telegram, etc.).

> Note: Unlike most other bot platforms, channels are installed and configured individually and locally, which means you have full control over the data that is transmitted between your bot and the chat platforms. Botpress does not proxy the messages to a 3rd party service as Microsoft Bot Framework does.

Behind the scenes, Botpress implements a queuing mechanism that processes ingoing and outgoing messages sequentially. If a message fails to be processed or sent for some reason, the message will be retried before raising an error to the developer and bot administrator.

### NLU

**Natural Language Understanding** (or **NLU**) involves your bot processing the messages received from the chat platforms, which are pure unstructured text, and transforming them into structured data that your bot will be able to work with. The main tasks the NLU engine does is:

- **Intent Recognition**: recognizing what the user wants
- **Entity Extraction**: extracting structured information from messages like dates, time, cities, names and more
- **Language Identification**: knowing in which language the user is writing
- **Sentiment Analysis**: evaluating the sentiment of the user (positive or negative)

All of the above will really help you create more natural and pleasurable conversations.

### Dialog Manager

Once you’ve received some text from a chat platform and transformed that text into structured data, the next component to be involved is the Dialog Manager (or DM). The role of the DM is to determine what the bot should do or say next.

Although the Dialog Manager could theoretically be implemented as a bunch of “If” and “Else” statements, this technique does not scale well in practice, because the unpredictability of natural sialogs increases the complexity of this kind of state machine exponentially.

Botpress solves this problem by combining an extensible Visual Flow Editor with a powerful Dialog Manager, which abstracts and eliminate the real complexity behind such State Machines.

> **Upcoming**: The Botpress core team is currently working on adding statistical decisions to the Dialog Manager, which will allow you to create even more natural experiences while also simplifying development.

### Content

Now that the DM has decided that your bot should reply with a certain message, there are a couple of pieces of information required before the message can be sent out to the user: what kind of message should it send and how is that message going to be rendered on the different chat platforms?

That is what Content Elements are for. A Content Element can be seen as a structured object that holds information about what to say, and a Content Renderer is a function that transforms that structured object into a platform-specific message.

The purpose of a Content Renderer is to allow developers to specify how the same information should behave (i.e., be displayed) on the different chat platforms.

### Extension Points

There are two ways you are going to inject code in Botpress: **actions** and **hooks**.

**Actions** are functions that are called by the Dialog Manager (in the context of a conversation) to retrieve data, call external services or implement custom reply logic.

**Hooks** are snippets of code that always get executed in the context they are located in. For example, snippets in the `on_server_start` directory get executed when Botpress Server starts.

##### File Structure

```bash
botpress-server
├── bp / bp.exe
│
└── data
│   │
│   ├── bots
│   │   └── name-of-your-bot
│   │       ├── bot.config.json # bot-specific configuration
│   │       ├── actions <1>
│   │       │   └── custom-code-1.js
│   │       │   └── # etc...
│   │       ├── flows
│   │       └── # etc... mostly auto-generated by the Studio UI
│   │
│   └── global
│       ├── actions <1> # shared actions across all bots
│       ├── hooks <2> # lifecycle hooks (custom code)
│       ├── botpress.config.json # configuration across all bots
│       └── # etc... mostly auto-generated by installed modules
│
└── modules
    ├── nlu.tgz
    ├── webchat.tgz
    └── # etc..
```

### Modules

A module is an extra component outside of the Botpress Core itself that you can install in your bot to add new features to Botpress. Every bot uses modules in a way since almost everything in Botpress is a module. This architecture allows for maximum flexibility and freedom for developers.
