---
layout: guide
---

When working with the bot a situation may occur when bot doesn't forget you.
E.g. you asked a question, get back in a month and bot still remembers previous context and tries to answer that question.

This isn't the best UX and so botpress handles this. In your botfile you can see these options:

```js
dialogs: {
  timeoutInterval: '2m', // How much time should pass before session is considered stale
  janitorInterval: '10s' // How often do we check for stale sessions
},
```

So if you started conversation and then didn't respond for 2 minutes your session will get expired.
This way bot will start conversation with you from the beginning.

# Performing actions on timeout

You may want to perform some actions for conversations that got stuck in the middle.
This is possible in 2 ways:

1. You can create a flow `timeout.flow.json` and it'll be called on timeout
2. You can create `timeout` node and it'll be called given user stopped responding in the same flow
