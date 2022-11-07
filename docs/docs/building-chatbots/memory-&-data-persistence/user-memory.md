---
id: user-memory
title: User Memory
---

--------------------

Variables set using the `user` namespace are saved as attributes for the user. This means that those attributes will always follow the user.

When a user sends a message to the chatbot, the first middleware loads that user's information. After processing everything, any changes to the `user` object will be persisted in the database.

This means that you can alter the `user` object using middlewares and actions, and your chatbot will save it at the end.

## User Memory - Data Retention

Since privacy is an important matter, a built-in system makes it easy to set retention periods for different types of information. You could have, for example, a policy that says "email expires after two months" or "remember user's mood for one day". Then, whenever the user's attribute is changed, the expiration policy is updated.

Here's how it could be configured:

```js
//data/global/botpress.config.json

dataRetention: {
  janitorInterval: '2m', // Check each 2 mins for expired data
  policies: {
    email: '60d', // Keep email for 30 days, reset if it is changed
    mood: '1d' // Forget user's mood after 1 day
    someChoice: '5m' // Keeps the variable alive for 5 minutes
  }
}
```

## Session Memory

The `session` store last for the user's session, depending on the setting of `sessionIntervalTimeout` in `botpress.config.json`.

This is also where we keep the last messages sent by the user. This information is used by the Decision Engine to understand the user's intent better and to avoid repeating meaningless stuff.