---
layout: guide
---

For this section, you'll need to head to the dashboard and click on the "Flows" section. You should see a flow diagram with a bunch of boxes and links.

# Flows, Nodes, Actions, Transitions

Don't panic! Even though this view might seem confusing at first, it's actually very simple once you understand how it works. The Flow Editor is built in a way that makes the experience consistent.

Let's explore and understand the different concepts around Flow Management before we actually start playing with it.

## Flows

Your bot's conversation logic is specified in the flows. More complex bots are generally broken down into multiple smaller flows instead of just one, big flow. The reason for breaking down the bot into multiple flows is simply to ease maintailability and reusability.

### Lifecycle

Our flow engine is event-based and is non-blocking by default, which means that a flow will execute all it can execute until it needs to wait.

> **Note:** There are currently two reasons for a flow to "wait":
> - A node is marked as waiting for user input
> - A node couldn't match a condition to transition to another node

Almost all the logic is hapenning and defined in the **Nodes** (the boxes inside the flow). We say "almost" because there are two small exceptions to that rule: **"On Receive"** and **"Transitions"** events.

### Flow-wide "On Receive"

The *On Receive* actions are **executed for every new message received by the bot inside this flow**.

To define new *Flow-wide On Receive Actions*, simply navigate to the relevant flow, then make sure you aren't selecting any node. The left panel should have a tab called *Flow Properties*. Under the *On Receive* section, click the *Add Action* button to add a new action.

> **👓 Examples:** Flow-wide On Receive
> - Audit Trail: Record specific logs of messages received in the scope of this specific flow
> - Authentication Gate: Run some authentication
> - Sentiment Analysis: Making sure the sentiment of the conversation is staying healthy

### Flow-wide "Transitions"

The *Transitions* are very closely related to *On Receive Actions*. The actions themselves can only run actions (and modify the state), but they can't make the flow switch to an other node. This is the role of *Transitions*.

**A transition is defined by a condition and a destination.** They can be seen as global conversation hooks in some way because they have the power to reroute the conversation to their will.

The *Flow-wide Transitions* are evaluated sequentially and the first to match is the one that will be triggered (the others won't be tried). If no condition is matched, then nothing happens and the regular flow is continued.

> **👓 Examples:** Flow-wide Transitions
> - Authentication Gate: Re-route the user to the login flow if they are not authenticated
> - Sentiment Analysis: Re-route the user to the human fallback node if the conversation is degrading
> - Matching flow-wide intents such as "`cancel`" etc..

### Storage

Flows are stored as JSON files in the bot's source. In the context of this tutorial, the flows are stored in the `src/flows/` folder. Each flow is split into two files: the logic (`*.flow.json`) and the visual-specific properties (`*.ui.json`). The reason to split these is to make easier to maintain and review changes. 

- `*.ui.json` files can almost always be ignored from code reviews as they don't affect the functionalities of the bot.
- `*.flow.json` files could also in theory be created manually by developers instead of using the GUI. This is the case for [Skills](./skills), which we will cover later.

## Nodes



### onEnter

### onReceive

### onNext

### Listening for user input

---

## Asking 5 questions instead of 3

## Asking user's name at the end

## Where are flows stored?
