---
id: proactive
title: Acting Proactively
---

## Overview

You may wish to make your bot act proactively on your website in response to some action. E.g., make the bot speak first, suggest they buy the product they are viewing after a set time or ask them for feedback on services they were using.

## Requirements

### Send an event from the webpage

First you need to open the webchat (either manually or programatically) and then send an event from the webpage.

> 📖 How do I open the webchat? Please refer to the [channel-web](../channels/web#embedding) section.

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

## Webchat events

There's currently 3 events that can be catched in your page :

| name            | Description                                                 |
| --------------- | ----------------------------------------------------------- |
| `webchatLoaded` | Triggered when the webchat is loaded and ready to be opened |
| `webchatOpened` | Triggered when the webchat button bubble is clicked         |
| `webchatClosed` | Triggered when the webchat close button is clicked          |

## Common use cases

Here are some examples of how can you use webchat events in your page.

### Send message on page load

This will send an event everytime the page is loaded.

Use this code in your `index.html`:

```html
<html>
  <head>
    <title>Embedded Webchat</title>
    <script src="/assets/modules/channel-web/inject.js"></script>
  </head>

  <body>
    This is an example of embedded webchat
  </body>

  <script>
    // Initialize the chat widget
    // Change the `botId` with the Id of the bot that should respond to the chat
    window.botpressWebChat.init({
      host: 'http://localhost:3000',
      botId: 'welcome-bot'
    })

    // Wait for the chat to load
    setTimeout(function() {
      window.botpressWebChat.sendEvent({
        type: 'proactive-trigger',
        channel: 'web',
        payload: { text: 'fake message' }
      })
    }, 1000)
  </script>
</html>
```

### Send message when the webchat is loaded

This will send an event when the webchat is loaded and ready to be opened.

Use this code in your `index.html`:

```html
<html>
  <head>
    <title>Embedded Webchat</title>
    <script src="/assets/modules/channel-web/inject.js"></script>
  </head>

  <body>
    This is an example of embedded webchat
  </body>

  <script>
    // Initialize the chat widget
    // Change the `botId` with the Id of the bot that should respond to the chat
    window.botpressWebChat.init({
      host: 'http://localhost:3000',
      botId: 'welcome-bot'
    })

    window.addEventListener('message', function(event) {
      if (event.data.name === 'webchatLoaded') {
        window.botpressWebChat.sendEvent({
          type: 'proactive-trigger',
          channel: 'web',
          payload: { text: 'fake message' }
        })
      }
    })
  </script>
</html>
```

### Send message when openning webchat

This will send an event when the webchat button bubble is clicked

Use this code in your `index.html`:

```html
<html>
  <head>
    <title>Embedded Webchat</title>
    <script src="/assets/modules/channel-web/inject.js"></script>
  </head>

  <body>
    This is an example of embedded webchat
  </body>

  <script>
    // Initialize the chat widget
    // Change the `botId` with the Id of the bot that should respond to the chat
    window.botpressWebChat.init({
      host: 'http://localhost:3000',
      botId: 'welcome-bot'
    })

    window.addEventListener('message', function(event) {
      if (event.data.name === 'webchatOpened') {
        window.botpressWebChat.sendEvent({
          type: 'proactive-trigger',
          channel: 'web',
          payload: { text: 'fake message' }
        })
      }
    })
  </script>
</html>
```

### Send custom content on proactive event

You can intercept a proactive trigger to send custom content. This could be used to send reminders, display a welcome message or ask for feedback.

- Make sure that you've sent an event from your webpage. See the examples above.
- Use this in your `before_incoming_middleware` hook:

```js
// Catch the event
if (event.type === 'proactive-trigger') {
  const eventDestination = {
    channel: event.channel,
    target: event.target,
    botId: event.botId,
    threadId: event.threadId
  }

  // Skip event processing
  event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)

  // Make the bot respond with custom content instead
  bp.cms.renderElement('builtin_text', { text: "I'm so proactive!", typing: true }, eventDestination).then(payloads => {
    bp.events.replyToEvent(event, payloads)
  })
}
```

Here we're using the [replyToEvent](https://botpress.io/reference/modules/_botpress_sdk_.events.html#replytoevent) function from the SDK to reply to the current event and [renderElement](https://botpress.io/reference/modules/_botpress_sdk_.cms.html#renderelement) to render our custom content.

### Send proactive only to new users

When you want to respond only to new users, you have to check if their session is new. We can do that by looking at the session's last messages.

- Make sure that you've sent an event from your webpage. See the examples above.
- Use this code in your `before_incoming_middleware` hook:

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

## Live Examples

If you'd like to play around with proactives, we provide a bot and some examples that you can interact with. These examples are probably the best way to learn everything you can do with proactives.

See how to install the Proactive Module [here](https://github.com/botpress/botpress/tree/master/examples/proactive).
