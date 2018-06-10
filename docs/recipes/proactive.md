---
layout: guide
---

You may need to make your bot act proactively on your website in response to some actions. E.g. suggest them to buy product they are viewing for too long or ask them for feedback on services they were using.

This appears to be quite simple with Botpress:

1. First you need to open bot-window and trigger custom action-type (I'll call it `proactive-trigger`) on the website on some event. This can be done this way:
```js
window.botpressWebChat.sendEvent({ type: 'show' })
window.botpressWebChat.sendEvent({ type: 'proactive-trigger', platform: 'web', text: 'smth' })
```

2. The event will be dispatched so now we need to add a handler for it. Here's a simple one:
```js
bp.hear({ type: /proactive-trigger/i }, async ({ user, text }, next) => {
  bp.renderers.sendToUser(user, '#builtin_text', { text: 'Hey there!', typing: true })
  next()
})
```

That's it! Given you have your builtin renderers registered, code above should work!
