---
layout: guide
---
Because chatbots are essentially softwares that live inside a chat, it comes without saying that **conversations are at the core of any chatbots**. Most of the time, a chatbot conversation is a communication between two users (usually the bot and a human) on a specific **channel**.

### Channels <a class="toc" id="toc-channels" href="#toc-channels"></a>

A **channel** is the bridge that allows two people to speak together. A channel can be SMS, Telegram, Facebook Messenger, Email, Slack etc...

Botpress is built to work for every possible channels. The way you can add support for a channel in your bot is by installing a Connector Module.

### Separating Concerns  <a class="toc" id="toc-separating-concerns" href="#toc-separating-concerns"></a>

Your bot's conversations are split into two parts: `Flow` and `Content`

#### Flow <a class="toc" id="toc-flow" href="#toc-flow"></a>

The flow of a conversation is essentially how your bot handles incoming messages according to the state of the conversation and the context. The flow of the conversation can be:

- Absent (lacking any conversational skills, for example an Echo Bot)
- Static Decision Tree (Essentially basic `if/elses`, [example](https://chatbotsmagazine.com/design-framework-for-chatbots-aa27060c4ea3))
- Dynamic Decision Tree (Based on Statistical Models)

99% of the bots on the market are based on Static Decision Trees.

We believe that it is the responsibility of the **Botmaster (you)** to implement a great Flow. For most bots, the Flow should be written with code.

**PRO TIP**: The Flow plays a critical part of the User Experience and should be well thought out upfront. **Flows should never be edited on-the-fly by amateurs** because you risk compromising the UX (which most online bot-building tools allow you to do).

As you will see in the next sections, Botpress tries to provide you with the best tools to create the best possible Flows (using [bp.convo](../flow/)).

#### Content <a class="toc" id="toc-content" href="#toc-content"></a>

The **Content** is what (and how) your bot actually **says** to the users on the different channels.

Botpress has a unique view on this. We believe that Content must be separated from the Flow for many reasons. To our knowledge, Botpress is the first framework to do things this way and we believe that most platforms will transition to this way of doing things.

In order to split the content from the flow (code), we introduced the [Content Renderers](../flow/).
