---
layout: guide
---

You may sometimes require to schedule some actions for the future.
In our example let's say we want to send a message at some defined date wishing our users "Merry Christmas"

First of all you need to have `@botpress/scheduler` module installed.
Once this is done you need to navigate to `/modules/scheduler` route and create new schedule.

In our case we can set up "Expression type" to "Once", specify date and time like `December 24, 2018 at 5:00pm`.

The final step is to specify action. This is the trickiest part. An action is code that will be executed at specified time.
Within this code you have access to `bp` and `task` variables. Here's an example snippet that uses await syntax to fetch all the userIds and to send them messages.

```js
const knex = await bp.db.get()
const userIds = await knex('users').distinct('userId').pluck('userId')
const text = 'Hey! Wishing you Merry Christmas!'
return Promise.all(
  userIds.map(userId => bp.renderers.sendToUser(userId, '#builtin_text', { text, typing: true }))
)
```

Note that in this example we are using `builtin_text` renderer which has to be registered properly.
