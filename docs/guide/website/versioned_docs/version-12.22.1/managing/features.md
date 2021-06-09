---
id: version-12.22.1-features
title: Useful Features
original_id: features
---

## Shortlinks

In Botpress, you can natively create short links to your chatbot and get the following benefits:

1. Short URLs - no one likes a long URL
2. Flexibility - it allows you to change any of the parameters without affecting the URL

### Implementation
In the example below, our new shortlink `/s/fs-wc` will redirect a user to `/lite/botId?m=platform-webchat&v=fullscreen` (the standard webchat interface). You can specify additional parameters in the options object.

Create a bot-scoped `after_bot_mount` hook with the following code:

```js
bp.http.createShortLink('fs-wc', `${process.EXTERNAL_URL}/lite/${botId}/`, {
  m: 'channel-web',
  v: 'fullscreen',
  options: JSON.stringify({
    config: {
      /* Custom config here... */
    }
  })
})
```
### Resources
See the views' [Config](https://github.com/botpress/botpress/blob/master/modules/channel-web/src/views/lite/typings.d.ts#L130) object for all available options.

It is recommended to also create a hook `after_bot_unmount`, to remove the shortlink when the chatbot is disabled; here is the corresponding example:

```js
bp.http.deleteShortLink('fs-wc')
```
## Listening For File Changes

You may find yourself writing custom logic when a Botpress file has changed. For example, you could listen for changes to the QnA files to automatically launch a translation worker to translate the QnA to multiple languages.

The Botpress File System (Ghost) exposes a way to listen for file changes for that purpose. In this example, we will watch for NLU changes inside any bot.

### Example

Let's create a Hook inside the `<data_dir>/global/hooks/after_bot_mount` called `listen_nlu.js` and put the following code inside it:

```js
const listener = bp.ghost.forBot(botId).onFileChanged(file => {
  if (
    file.toLowerCase().startsWith(`data/bots/${botId}/intents/`) ||
    file.toLowerCase().startsWith(`data/bots/${botId}/entities/`)
  ) {
    bp.logger.info('NLU Data has changed: ' + file)
  }
})

setTimeout(() => {
  // Example of how to stop listening after 1m
  listener.remove()
}, 60 * 1000)
```

## Inter-bot Communication / Delegation

Sometimes your chatbot needs to "delegate" questions or tasks to other bots. We call this concept "inter-bot" communication.

The code in this sample is available in the [examples](https://github.com/botpress/botpress/tree/master/examples/interbot) directory of our GitHub repository (update `workspaces.json` with the three chatbots if you copied them).

![Example](../assets/tutorials_interbot-example.png)

### Structure

![Diagram](../assets/tutorials_interbot-diagram.png)

### Step 1 – Creating the chatbots
You will need to create three chatbots: one "master" chatbot (the one that will delegate questions to other bots) and two "slave" chatbots (the ones who get asked questions by the master).

Head to the admin interface and create three chatbots with the names, `master`, `sub1`, and `sub2`, respectively, all based on the "empty bot" template.

- Leave the `master` chatbot empty for now.
- In the `sub1` bot, create some QnA entries related to the same domain (pick the default `global` category/context).
- In the `sub2` bot, do the same thing you did with `sub1`, but for another domain.

For example, `sub1` could answer questions about Human Resources, while `sub2` could answer IT Operations questions.

At this point, you should have three bots. Master doesn't do anything, while sub1 and sub2 can answer HR and IT Operations questions respectively when you talk to them individually.

### Step 2 – Delegation Action (master bot)

To make the Master chatbot ask the questions to the slave bots, we will create an action called `delegate_to_bots` inside the `master` bot.

This action [can be found here](https://github.com/botpress/botpress/tree/master/examples/interbot/bots/master/actions/delegate_to_bots.js). Just copy and paste this file in your `<data>/bots/master/actions` directory.

Next, create a flow that makes use of that action. For the sake of simplicity, the `master` chatbot will only be able to delegate what you tell him to the slave bots. You could call the action at any time and even adapt the `delegate_to_bots` action to pass in more contexts.

In the `main.flow.json` flow of your master bot, recreate the structure below.

![Flow](../assets/tutorials_interbot-flow.png)

The content of the text element is the following:

```
The chatbot {{temp.delegation.0.botId}} can help you with that question.

[Talk to {{temp.delegation.0.botId}}]({{{temp.delegation.0.botUrl}}})

By the way, {{temp.delegation.0.botId}} is telling you:
> {{{temp.delegation.0.answer}}}
```

> **Tip:** The reason we use triple mustaches (`{{{ ... }}}`) is to prevent Botpress from escaping the special characters found in the variables.

### Conclusion

That's it! You now have the basic structure in place to allow inter-bot collaboration.
