---
id: flows
title: Flows
---

For this section, you'll need to head to the dashboard and click on the "Flows" section. You should see a flow diagram with a bunch of boxes and links.

# 📚 State, Flows, Nodes, Actions, Transitions

Don't panic! Even though this view might seem confusing at first, it's straightforward once you understand how it works. The Flow Editor is built in a way that makes the experience consistent.

Let's explore and understand the different concepts around Flow Management before we actually start playing with it.

## Flows

Your bots conversation logic is specified in the flows. More complex bots are generally broken down into multiple smaller flows instead of just one, big flow. The reason for breaking down the bot into multiple flows is to ease maintainability and reusability.

### Lifecycle

Our flow engine is event-based and is non-blocking by default, which means that a flow will execute all it can execute until it needs to wait.

> **Note:** There are currently two reasons for a flow to "wait":
>
> - A node is marked as waiting for user input
> - A node couldn't match a condition to transition to another node

Almost all the logic is defined and happens in the **Nodes** (the boxes inside the flow). We say "almost" because there are two small exceptions to that rule: **"On Receive"** and **"Transitions"** events.

### Flow-wide "On Receive"

The _On Receive_ actions are **executed for every new message received by the bot inside this flow**.

To define new _Flow-wide On Receive Actions_, navigate to the relevant flow, then double click anywhere on the checkered background to show the _Flow Properties Pop up_. Under the _On Receive_ section, click the _Add Action_ button to add a new action.
![GIF showing how to show the Flow Properties pop up](assets/GettingStarted_TriviaFlows_FlowWideOnReceive.gif)

> **👓 Examples:** Flow-wide On Receive
>
> - Audit Trail: Record specific logs of messages received in the scope of this particular flow
> - Authentication Gate: Run some authentication
> - Sentiment Analysis: Making sure the sentiment of the conversation is staying healthy

### Flow-wide "Transitions"

The _Transitions_ are very closely related to _On Receive Actions_. The actions themselves can only run actions (and modify the
), but they can't make the flow switch to another node. This is the role of _Transitions_.

**A transition is defined by a condition and a destination.** They can be seen as global conversation hooks in some way because they have the power to reroute the conversation to an entirely new node or flow.

The _Flow-wide Transitions_ are evaluated sequentially, and the first to match is the one that will be triggered (the others won't be tried). If no condition is matched, then nothing happens and the regular flow is continued.

> **👓 Examples:** Flow-wide Transitions
>
> - Authentication Gate: Re-route the user to the login flow if they are not authenticated
> - Sentiment Analysis: Re-route the user to the human fallback node if the conversation is degrading
> - Matching flow-wide intents such as "`cancel`" etc..

### Storage

Flows are stored as JSON files in the bot's source files. In the context of this tutorial, the flows are stored in the `data/bots/trivia-bot/flows/` folder. Each flow is split into two files: the logic (`*.flow.json`) and the visual-specific properties (`*.ui.json`). The reason to split these is to make easier to maintain and review changes.

- `*.ui.json` files can almost always be ignored from code reviews as they don't affect the functionality of the bot.
- `*.flow.json` files could also, in theory, be created manually by developers instead of using the GUI. This is the case for [Skills](./skills), which we will cover later.

## Nodes

Nodes are the primary units of the conversational logic of your bot. **An active conversation** (which we call a "**session**") **always has one and only one active node**. A node generally transitions to another node or flow. When it doesn't, the conversation is ended. The next message from the user will then be part of an entirely new session.

A _node_ is separated into three different stages: **onEnter** (A), **onReceive** (B) and **onNext** (C).

![Typical Flow Node](assets/flow_node.png)

### onEnter

_onEnter_ is a list of actions that will be executed when the node is **entered**. If multiple actions are defined, all of them will be executed sequentially.

### onReceive

_onReceive_ is a list of actions that will be executed when the node receives a message while being the active node. As soon as there is an action defined, the node will automatically be waiting for user input (orange node).

When this property is left unused, the node is non-blocking (black), which means it will flow straight from the `onEnter` to the `onNext`.

![Blocking vs Non-Blocking Nodes](assets/node_blocking.png)

### onNext / Transitions

_onNext_ (which can also be called Transitions) is exactly the same thing as _Flow-wide Transitions_ except that the conditions are evaluated only after `onReceive` or `onEnter` have been executed.

> **Special cases**: If no condition is defined, the default behavior is that the conversation ends.
> If there are conditions defined but none match, nothing happens, i.e., the current node stays active, and it will flow when a condition is matched. By default, the `onNext` will only be retried after `onReceive` is re-invoked.

Nodes can flow to:

- Another node within the same flow
- Itself (i.e., loop back to itself)
- Another flow
- To the previous flow (see Flow Stacks)
- The end of the conversation

## State

Each conversation has a **State** associated with it. The state is created when the conversation session is started and is destroyed when the session is ended.

In the context of this tutorial, this means that a state is created just before the "_entry_" node is entered and just after the "_over_" node is executed.

![Lifetime of a conversation state](assets/stateLifetime.jpg)

> **Note:** The state is global to the conversation, so if the conversation spans multiple flows, **the state is shared for all the flows**.
