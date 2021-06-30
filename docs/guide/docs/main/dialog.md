---
id: dialog
title: Creating Conversations
---

Botpress uses what we call the **Dialog Engine** to handle conversations. The Dialog Engine is responsible for every interaction with a chatbot. It handles the user input and the chatbot response. But between the two, a whole lot is happening.

## Overview

The Dialog Engine uses [Flows](#flows) representing a chatbot's overall conversational logic. A Flow is then composed of [Nodes](#nodes) which execute a series of [Instructions](#node-lifecycle). Instructions are part of a Node lifecycle and can execute [Actions](#actions). An Action is a code snippet, usually code that you have written yourself, code provided by Botpress or others.

## Flows

A workflow allows you to break down a complex chatbot into multiple smaller flows. Breaking down the chatbot into multiple flows makes it easier to maintain, and you can re-use these flows when building other workflows or even other chatbots.

Let's look at our Botpress support bot **Blitz**. We can add three flows to handle _issues, tickets_, and _troubleshooting
![Task Breakdown](../assets/workflow-breakdown.png)

### Flow Lifecycle

A flow always starts at the `startNode` of its `*.flow.json` file, with the _Main_ flow being the first to be executed at the beginning of each conversation. The start node points to the node which is to be executed first by name. Once the node is selected, the Dialog Engine will queue the active node's instructions and execute the instructions sequentially.

The Dialog Engine is event-based and is non-blocking by default, which means that a flow will execute all it can manage until it needs to wait.

> **Note:** There are currently two reasons for a flow to "wait":
>
> - A node is marked as waiting for user input
> - A node couldn't match a condition to transition to another node
> - A node has no transition instruction.

Once the first node is processed, the Dialog Engine will proceed to the next node in the flow until it reaches the very end. Flows are pretty straightforward. Nodes also have a [lifecycle](#node-lifecycle) of their own. It is the nodes that do the heavy lifting in a flow. The flow only orchestrates them.

### Storage

Flows are stored as JSON files in the chatbot's source files. In the context of this tutorial, the flows are stored in the `data/bots/blitz/flows/` folder. Each flow is split into two files: the logic (`*.flow.json`) and the visual-specific properties (`*.ui.json`). The reason to split these is to make it easier to maintain and review changes.

- `*.ui.json` files can almost always be ignored from code reviews as they don't affect the chatbot's functionality.
- `*.flow.json` files could also, in theory, be created manually by developers instead of using the GUI. This is the case for [Skills](#skills), which we will cover later.

## Nodes

Nodes are the primary units of the conversational logic of your chatbot. **An active conversation** (which we call a "**session**") **always has one and only one active node**. A node generally transitions to another node or flow. When there aren't any more transitions, the conversation ends. The following message from the user will then be part of an entirely new session.

A _node_ is separated into three different stages: **onEnter** (A), **onReceive** (B) and **onNext** (C).

![Typical Flow Node](../assets/flow_node.png)

### Node Lifecycle

#### On Enter

**onEnter** is a list of instructions executed when the node is **entered**. If multiple actions are defined, your chatbot will execute all of them sequentially.

#### On Receive

**onReceive** is a list of instructions executed when the node receives a message from the user while it is active. As soon as an action is defined, the node will automatically be waiting for user input (orange node).

When this property is left unused, the node is non-blocking (black), which means it will flow straight from the `onEnter` to the `onNext`.

![Blocking vs. Non-Blocking Nodes](../assets/node_blocking.png)

#### Flow-wide On Receive

You can define an onReceive instruction that will **always** be executed before every node's onRecieve.

> **👓 Examples:** Flow-wide On Receive
>
> - Audit Trail: Record specific logs of messages received in the scope of this particular flow
> - Authentication Gate: Run some authentication
> - Sentiment Analysis: Making sure the sentiment of the conversation is staying healthy

To define new _Flow-wide On Receive Actions_, navigate to the relevant flow, then double click anywhere on the checkered background to show the _Flow Properties Pop up_. You can also click on the links in the top left corner of the flow editor. Under the _On Receive_ section, click the _Add Action_ button to add a new action.
![Flow Properties](../assets/flow_wide_onreceive.png)

#### onNext

**onNext** (also called **Transitions**) is precisely the same thing as _Flow-wide Transitions_ except that the conditions are only evaluated
 after `onReceive` or `onEnter` have been executed.

> **Special cases**: If no condition is defined, the default behavior is that the conversation ends.
> If there are conditions defined but none match, nothing happens, i.e., the current node stays active, and it will flow when a condition is matched. By default, the `onNext` will only be retried after `onReceive` is re-invoked.

**Destination**: A Transition always has a target that we call a Destination. It can be:

- A different Node
- A different Flow
- The previous Flow
- Itself (Loopback on itself)
- The end of the conversation

#### Flow-wide onNext

A Flow-wide onNext instruction allows you to override node transitions when the condition is successful.

> **👓 Examples:** Flow-wide onNext
>
> - Authentication Gate: Re-route the user to the login flow if they are not authenticated.
> - Sentiment Analysis: Re-route the user to the human fallback node if the conversation is degrading
> - Matching flow-wide intents such as "`cancel`" etc...

## State

Each conversation has a **State** associated with it. The state is created when the conversation session is started and is destroyed when the session is ended.

A state is created just before the "_entry_" node is entered.

![Lifetime of a conversation state](../assets/stateLifetime.png)

> **Note:** The state is global to the conversation, so if the conversation spans multiple flows, **they will all share the same state**.

## Session Timeout
The Dialog Engine will wait for the input of a user. After a while, if the user does not respond, the session will **Timeout**.
Timeout allows you to end the conversation gracefully if need be. It can also be helpful to do some processing before deleting the session. For instance, you could save the user contact information to an external database, or tell the user how to contact you or inform the user his session has timed out.

### Timeout Flow

You can use a Timeout Flow to handle your timeout logic. It works just like a regular flow. All you have to do is add a Flow called `timeout.flow.json` to your chatbot and specify a start node. Then, the Dialog Engine will detect your Timeout Flow next time a user times out.

### Timeout Node

Very similar to the Timeout Flow, the Timeout Node should be called `timeout` and should belong to the current flow. You don't have to link it to any other node. The Dialog Engine will detect the node based on its name.

### Timeout Transition

Another option that requires some coding is to add the property `timeoutNode` to your `*.flow.json` file and assign it to the name of the node that should handle the timeout. Again, it can be any node; it doesn't need to be called a particular way.

> ⚠ **Important:** Once the Dialog Engine has processed the timeout, it will **delete** the session.

## Actions

An **Action** is JavaScript code that is executed in a Node.js VM. It can be anything you want. Call an API, store something in the database or store something in the Key-value Store. Actions are called by onEnter and onReceive instructions. There are two types of Actions:

- **Script**: A user-defined Action that is used to run custom code.
- **Output**: An output Action that is used to make a chatbot output something.

> To learn more on Actions, please refer to the [Custom Code](/docs/main/code) section.

## Skills

After building a couple of flows/bots, you'll quickly notice that there are some **common patterns** that you find yourself implementing over and over. Skills come to the rescue.

Skills are higher-level abstractions on top of flows that serve as dynamic flow generators.

They can be seen as reusable components between multiple flows or even multiple chatbots.

### Installing skills

A module must expose every skill. Modules can host any number of skills. All you need to do is install the required module, and you will have access to its skills.

### Using skills

Skills are meant to be used by the Botpress Flows GUI. After installing a skill module, navigate to a flow in the Graphical Flows Editor, then locate the "Insert Skill" toolbar to the left of the flow builder interface.
![Using the skills from the GUI](../assets/skillsMenu.png)

After filling in the form, you'll be able to click anywhere in the flow to insert the skill to be consumed by the other nodes.

### Persistence

Skills are stored as flows under the `data/bots/your-bot/flows/skills` folder. Skill nodes in the Studio Interface have the name of the skill appended to the node name, making them easily identifiable.

### Editing skills

Once a skill node has been generated, you may click on that node and click "Edit" on the right panel to edit that node, which will update the generated flow automatically behind the scenes. 

![Editing a skill from GUI](../assets/skillsEdit.png)

> While you can rename your skill to any name you want, it is considered best practice to append the skill type to the node name, for example, `choice-choose-topping`.
