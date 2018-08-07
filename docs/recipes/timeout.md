---
layout: guide
---

Occasionally a user may leave a conversation with your bot part way through the interaction, leaving it an unwanted state. 

This could lead to the bot trying to answer the wrong question when the user returns to the conversation at a later time, which is a bad user experience.

To prevent this Botpress has the ability to set the time-to-live on a session and how often these should be checked. You will find the following options in `botfile.js`. 

```js
dialogs: {
  timeoutInterval: '2m', // How much time should pass before session is considered stale
  janitorInterval: '10s' // How often do we check for stale sessions
},
```

This means that if you started a conversation and then didn't respond for 2 minutes, the bot would set your session as expired.
When you then resume the conversation, the bot will start from the beginning.

# Performing actions on timeout

You may want to perform some actions for conversations that got stuck in the middle.
You may specify the node that'll be called given user stopped responding (the precedence is as in this list):

1. Add `timeoutNode` key with node-name to json-file of the given flow for the node on which you want to catch timeout
2. Add `timeoutNode` key with node-name to json-file of the given flow on which you want to catch timeout
3. Add `timeout` node on the flow you want to catch timeout
4. Add `timeout.flow.json` and it'll be called on timeout
