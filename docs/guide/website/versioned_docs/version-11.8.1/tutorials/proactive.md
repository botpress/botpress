---
id: version-11.8.1-proactive
title: Acting Proactively
original_id: proactive
---

You may wish to make your bot act proactively on your website in response to some action. E.g., suggest they buy the product they are viewing after a set time or ask them for feedback on services they were using.

With Botpress this is simple:

1. First you need to open the bot-window and then trigger a custom action-type (`proactive-trigger` in the example below). These can be triggered by a javascript event such as a timeout.

```js
window.botpressWebChat.sendEvent({ type: 'show' })
window.botpressWebChat.sendEvent({
  type: 'proactive-trigger',
  channel: 'web',
  payload: {
    text: 'smth'
  }
})
```

2. This trigger will be dispatched to the bot so you need to add a handler for it. This should be added as a [Hook](../main/code#hooks)

```js
if (event.type === 'proactive-trigger') {
  const payloads = await bp.cms.renderElement('builtin_text', { text: 'Hey there!', typing: true }, event.channel)
  bp.events.replyToEvent(event, payloads)
}
```

That's it! If you have your builtin renderers registered, the code above will work!
