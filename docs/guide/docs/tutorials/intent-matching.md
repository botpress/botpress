---
id: intent-matching
title: How to act on an intent
---

## Switch Case Method

Let's start by creating intents. We created `book-flight`, `cancel-flight` and `get-prices`.

![](assets/intent-matching-switch-intents.png)

On our entry node, we create transitions. Click on the `Intent Is` radio button and select the intent of your choice.
We're leaving `When condition is met` empty for now, because we're going to manually link the nodes later on.

![](assets/intent-matching-transition.png)

The entry node now looks like this:

![](assets/intent-matching-node.png)

To act when an intent is detected, we created a node for each transition and added some text to confirm our intentions.

![](assets/intent-matching-switch-case.png)

Now when we test the bot, we get the expected result.

![](assets/intent-matching-switch-conversation.png)

## QNA Method

This method is the most basic of the three. The fact that we're not showing it first is because QNA uses something very similar the the Switch Case Method in the background. A QNA item is basically an intent.

We're modifying our flow and removing all transitions. QNA will "jump" to the flow / node of your choice.

![](assets/intent-matching-qna-flow.png)

In QNA, we create the flight booking questions.

![](assets/intent-matching-qna-new.png)

Then the cancel flight questions.

![](assets/intent-matching-qna-cancel.png)

And then we can test the bot.

![](assets/intent-matching-qna-conversation.png)

> This method is not considered best practice, but it does the job for quick demonstrations. However, we definitely recommend to use the first method if you have basic intents without any slots.

## Slot Skill Method

### Combining Switch Case and Slot Skill

The Slot Skill can be used in collaboration with the "Switch Case Method". For instance, an intent could have zero slots while another could have multiple.

For this example, we're adding a `destination` slot to the `book-flight` intent.

![](assets/intent-matching-slot-intents.png)

Then we create a new Slot Skill and select the `destination` slot.

![](assets/intent-matching-slot-skill.png)

We can now edit our confirmation message so that it confirms the actual destination.

![](assets/intent-matching-slot-text.png)

The flow now looks like this:

![](assets/intent-matching-slot-flow.png)

When we test the conversation, we can see that the bot will confirm the flight booking destination.

![](assets/intent-matching-slot-conversation.png)

> **Note**: The Slot Skill use implicit intent matching in the background. So its not required to have a transition to a Slot Skill. In this case

### Chaining

First we need to have an intent with multiple slots so that Slot Skill chaining is relevant.

![](assets/intent-matching-slot-chain-intents.png)

When we try to extract multiple slots on the same intent, we want to chain our Slot Skills like this:

![](assets/intent-matching-slot-chain-flow.png)

![](assets/intent-matching-slot-chain-conversation.png)
