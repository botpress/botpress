---
id: version-11.9.0-proactive
title: Acting Proactively
original_id: proactive
---

You may wish to make your bot act proactively on your website in response to some action. E.g., make the bot speak first, suggest they buy the product they are viewing after a set time or ask them for feedback on services they were using.

## Requirements

### Send an event from the webpage

First you need to open the chat widget (either manually or programatically) and then send an event from the webpage.

```js
window.botpressWebChat.sendEvent({
  type: 'proactive-trigger',
  channel: 'web',
  payload: {
    text: 'fake message'
  }
})
```

The property `type: 'proactive-trigger'` is used to identify the event so we can catch it and act on it later on.

### Catch the event in a hook

This event will be dispatched to the bot so you need to add a handler for it. If this event is not handled, it will be interpreted as a user message.

This snippet should be added to the [before_incoming_middleware hook](../main/code#before-incoming-middleware):

```js
// Catch the event sent from the webpage
if (event.type === 'proactive-trigger') {
  // You custom code
}
```

> **Tip**: Use `event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)` to tell the dialog engine to skip the event processing. This is useful when your event is not a user message.

## Make the bot speak first

One of the most popular use-case for proactive messages is to trigger the first message of the bot.

Copy and paste the following snippet in your hook:

```js
if (event.type === 'proactive-trigger') {
  // We only want to trigger a proactive message when the session is new,
  // otherwise the conversation will progress everytime the page is refreshed.
  if (event.state.session.lastMessages.length) {
    // This will tell the dialog engine to skip the processing of this event.
    event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
  }
}
```

## Send custom content on a proactive event

You can intercept a proactive trigger to send custom content. This could be used to send reminders, suggest that they buy the product or ask for feedback.

```js
if (event.type === 'proactive-trigger') {
  const eventDestination = {
    channel: event.channel,
    target: event.target,
    botId: event.botId,
    threadId: event.threadId
  }

  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)

  bp.cms.renderElement('builtin_text', { text: "I'm so proactive!", typing: true }, eventDestination).then(payloads => {
    bp.events.replyToEvent(event, payloads)
  })
}
```

Here we're using the [replyToEvent](https://botpress.io/reference/modules/_botpress_sdk_.events.html#replytoevent) function from the SDK to reply to the current event and [renderElement](https://botpress.io/reference/modules/_botpress_sdk_.cms.html#renderelement) to render our custom content.
