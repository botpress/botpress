---
layout: guide
---

You may wish to make your bot act proactively on your website in response to some action. E.g., suggest they buy the product they are viewing after a set time or ask them for feedback on services they were using.

With Botpress this is simple:

1. First you need to open the bot-window and then trigger a custom action-type (`proactive-trigger` in the example below). These can be triggered by a javascript event such as a timeout.

```js
window.botpressWebChat.sendEvent({ type: 'show' })
window.botpressWebChat.sendEvent({ 
  type: 'proactive-trigger', 
  platform: 'web', 
  text: 'smth' })
```

2. This trigger will be dispatched to the bot so you need to add a handler for it. Here is a simple example:
```js
bp.hear({ type: /proactive-trigger/i }, async ({ user, text }, next) => {
  bp.renderers.sendToUser(user, '#builtin_text', { text: 'Hey there!', typing: true })
  next()
})
```

That's it! If you have your builtin renderers registered, the code above will work!
