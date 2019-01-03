---
id: version-11.0.1-memory
title: Bot Memory and Data Retention
original_id: memory
---

> **Note**: All of the above methods that start are marked with an asterisk (\*) support variable **expiry**, which means you can control when Botpress should forget the information stored.

## Dialog Memory

The Dialog Memory is how your bot will remember things in the context of a conversation. The way you can store and retrieve data is by using Actions inside the flows. There are three types of memory available: **user**, **conversation** and **global**.

You can consume a memory action just like any other action from the Botpress Flow Editor.

##### Memory Action Example

![Flow Memory Action](assets/flow-memory-action.jpg)

### User Memory

Variables stored inside this memory are persisted and remain available for the same user. They survive the different conversations.

##### Actions

- **setUserVariable\***
- **getUserVariable**

### Conversation Memory

Variables stored inside this memory are persisted across the conversation and discarded when the session ends; that is, after the flow engine completes.

##### Actions

- **setConversationVariable\***
- **getConversationVariable**

### Global Memory

Variables stored inside this memory are shared between all users and conversations inside the same bot.

##### Actions

- **setGlobalVariable\***
- **getGlobalVariable**

## General Storage

If you want to store information differently, or when outside of a flow (e.g. from a [Hook](/docs/build/code#hooks)), you can use the lower-level storage API, the Key-Value-Store (KVS).

The KVS works very similarly to the get/set actions except you have to decide on the storage key yourself. Think of the KVS as an oversimplified NoSQL store where all you need to know to store something is a unique key.

The KVS is available from the [Botpress SDK (**`bp.sdk`**)](https://botpress.io/reference/modules/_botpress_sdk_.kvs.html) and supports expiry as well. In fact, the storage actions are simply wrappers for the KVS.
