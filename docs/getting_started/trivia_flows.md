---
layout: guide
---

For this section, you'll need to head to the dashboard and click on the "Flows" section. You should see a flow diagram with a bunch of boxes and links.

# 📚 State, Flows, Nodes, Actions, Transitions

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

Nodes are the main units of the conversational logic of your bot. **An active conversation** (what we call a "**session**") **always have one and only one active node**. A node generally transitions to another node or flow. When it doesn't, the conversation is ended. The next message from the user will then be part of an entirely new session.

A *node* is separated into three different stages: **onEnter** (A), **onReceive** (B) and **onNext** (C).

![Typical Flow Node][flow_node]

### onEnter

*onEnter* is a list of actions that will be executed when the node is **entered**. If multiple actions are defined, all of them will be executed sequentially.

### onReceive

*onReceive* is a list of actions that will be executed when the node receives a message while being the active node. As soon as there is an action defined, the node will automatically be waiting for user input (orange node).

When this property is left unused, the node is non-blocking (black), which means it will flow straight from the `onEnter` to the `onNext`.

![Blocking vs Non-Blocking Nodes][node_blocking]

### onNext / Transitions

*onNext* (which can also be called Transitions) is exactly the same thing as *Flow-wide Transitions* except that the conditions are evaluated only after `onReceive` or `onEnter` have been executed.

> **Special cases**: If no condition is defined, the default behavior is that the conversation ends.
If there are conditions defined but none match, nothing happens, i.e. the current node stays active and it will flow when a condition is matched. By default the `onNext` will only be retried after `onReceive` is re-invoked.

Nodes can flow to:

- Another node within the same flow
- Another flow
- To the previous flow (see Flow Stacks)
- The end of the conversation

## State

Each conversation has a **State** associated to this conversation. The state is created when the conversation session is started and is destroyed when the session is ended.

In the context of this tutorial, this means that a state is created just before the "*entry*" node is entered and just after the "*over*" node is executed.

![Lifetime of a conversation state][stateLifetime]

> **Note:** The state is global to the conversation, so if the conversation spans multiple flows, **the state is shared for all the flows**.

---

#  🔨 Hands-on

Now that you understand how flows and nodes work, let's jump into some use cases for our Trivia bot.

## Asking 5 questions instead of 3

Let's start with something trivial. You should identify the black node called "*next*". 

You'll notice the following Transition:

```js
state.count >= 3
```

You can simply change `3` by `5` from the UI, then hit the "Save" icon at the top to persist the changes.

![Updating a transition from the UI][node_transition]

The recommended way to create and edit the flows is via the graphical interface. It is usually much quicker, faster and less error-prone.

But for the sake of completeness of this tutorial and since we're technical folks and love code (right?) let's see how to do that in code instead. Open up the `src/flows/main.flow.json` and locate the "*next*" node. Let's update the code as follow:

```diff
{
  "id": "11219c5913",
  "name": "next",
  "next": [
    {
-    "condition": "state.count >= 3",
+    "condition": "state.count >= 5",
      "node": "over"
```

This is the first and only time that we'll edit the flows by code in this tutorial.

## Leaderboard: Nicknames

OK, now that the bot asks a reasonable amount of questions, we want to build a leaderboard to push the gamification to to another level!

The first step to building a leaderboard is to ask the user for his nickname at the end of the game:

![Asking the user for his nickname][ask_nickname]

Now the bot will be asking the user for his nickname at the end of every game. But that's not what we want! We actually want to ask the user only if we don't already know what his nickname is.

In order to do that, we will need to tell the bot to memorise the nickname of the user. That's should be pretty easy as our Trivia template came with a function that does that for us: `setUserTag({ name, value })`

### Calling an action from the Visual Flow Builder

What we want is the following:
- WHEN the user tells the bot his nickname
- THEN we want to say "*Thanks, `{{event.text}}` is an original nickname!*"
- THEN we want to persist his answer into a user-wide variable

To do that, click on the "*ask-name*" node, then in the "*On Receive*" section, click **Add action**.

![Set the nickname into user tag][setUserTag]
![Set the nickname into user tag (node)][setUserTagNode]

What the `setUserTag({ name, value })` action does is that is saves anything (`value`) into a user storage variable (tag named `name`).

> **Note:** Do not worry about how the `setUserTag` action is implemented, we will get to that in the very next section.

### Recalling the user's nickname

OK, now that we persist the user's nickname somewhere, we also need to pull that nickname back when the user starts a new game.

To do that, click on the "*entry*" node, then in the "*On Enter*" section, click **Add action**.

![Get the nickname from user tag][getUserTag]
![Get the nickname from user tag (node)][getUserTagNode]

What the `getUserTag({ name, into })` action does is that is loads a tag (named `name`) *into* the state under a variable called `into`.

### Conditional asking

The last step now is to only ask for the nickname when we don't know the nickname already. When this is the case, `getUserTag` should put `null` *into* the *"nickname"* state variable.

![Asking only when nickname is unknown][nicknameCondition1]
![Nickname is unknown condition][nicknameCondition2]

Finally you want to end the flow if we already know the nickname:

![End flow otherwise][otherwiseCondition]
![End flow otherwise (result)][otherwiseConditionResult]

That's it! Your bot is now asking the user for his nickname once then will remember it forever.

> **🌟 Tip:** Say `/forget` to the bot to make it forget your *nickname*.

[stateLifetime]: {{site.baseurl}}/images/stateLifetime.jpg

[flow_node]: {{site.baseurl}}/images/flow_node.png
[node_blocking]: {{site.baseurl}}/images/node_blocking.png
[node_transition]: {{site.baseurl}}/images/node_transition.png
[ask_nickname]: {{site.baseurl}}/images/ask_nickname.jpg

[getUserTag]: {{site.baseurl}}/images/getUserTag.jpg
[getUserTagNode]: {{site.baseurl}}/images/getUserTagNode.jpg
[setUserTag]: {{site.baseurl}}/images/setUserTag.jpg
[setUserTagNode]: {{site.baseurl}}/images/setUserTagNode.png

[nicknameCondition1]: {{site.baseurl}}/images/nicknameCondition1.jpg
[nicknameCondition2]: {{site.baseurl}}/images/nicknameCondition2.jpg

[otherwiseCondition]: {{site.baseurl}}/images/otherwiseCondition.jpg
[otherwiseConditionResult]: {{site.baseurl}}/images/otherwiseConditionResult.jpg
