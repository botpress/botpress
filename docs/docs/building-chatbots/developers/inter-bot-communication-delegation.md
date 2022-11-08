---
id: inter-bot-communication-delegation
title: Inter-bot Communication / Delegation
---

--------------------

A chatbot can "delegate" questions or tasks to other bots. We call this concept "inter-bot" communication.

The code for this example is available in the [examples](https://github.com/botpress/botpress/tree/master/examples/interbot) directory of our GitHub repository (update `workspaces.json` with the three bots if you copied them).

![Example](/assets/tutorials_interbot-example.png)

## Structure

![Diagram](/assets/tutorials_interbot-diagram.png)

## Step 1 – Creating the bots

The first thing you need to do is create three bots: one "master" bot (the one that will delegate questions to other bots), and two "slave" bots (the ones who get asked questions by the master).

Head to the admin interface and create three bots names `master`, `sub1` and `sub2` respectively, all based on the "empty bot" template.

- Leave `master` bot empty for now.
- In the `sub1` bot, create some QnA entries that are related to the same domain (pick the default `global` category/context).
- In the `sub2` bot, do the same thing for another domain.

For example, `sub1` could answer questions about Human Resources, while `sub2` could answer questions related to IT Operations.

At this point, you should have three bots. Master doesn't do anything, while sub1 and sub2 can answer questions about HR and IT Operations respectively when you talk to them individually.

## Step 2 – Delegation Action (master bot)

Now let's see how you can make the Master bot ask the questions to the slave bots. To do this, we are going to create an action called `delegate_to_bots` inside the `master` bot.

The action you need to create [can be found here](https://github.com/botpress/botpress/tree/master/examples/interbot/bots/master/actions/delegate_to_bots.js). Just copy and paste this file in your `<data>/bots/master/actions` directory.

Next, you will need to create a flow that make use of that action. For the sake of simplicity of this tutorial, all the `master` bot will be able to do is delegate anything you tell him to the slave bots. Of course you could call the action at any time and even adapt the `delegate_to_bots` action to pass in more contexts etc.

In the `main.flow.json` flow of your master bot, recreate the structure below.

![Flow](/assets/tutorials_interbot-flow.png)

The content of the text element is the following:

```
The bot {{temp.delegation.0.botId}} can help you with that question.

[Talk to {{temp.delegation.0.botId}}]({{{temp.delegation.0.botUrl}}})

By the way, {{temp.delegation.0.botId}} is telling you:
> {{{temp.delegation.0.answer}}}
```

:::tip
The reason we use triple mustaches (`{{{ ... }}}`) is to prevent Botpress from escaping the special characters found in the variables.
:::

## Conclusion

That's it! You now have the basic structure in place to allow inter-bot collaboration.
