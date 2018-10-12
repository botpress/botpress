---
id: scheduling
title: Scheduling messages
---

You may sometimes require your bot to send a message to your users at a point in the future. The scheduler module allows you to define a message and set when to send it, ether on a timer or once.

In the example below you are going to create a schedule that sends the message `Hey! Wishing you Merry Christmas!` to all your users on Christmas Eve.

Firstly, you need to install the [`@botpress/scheduler`](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-scheduler) module:

```bash
# npm
npm i @botpress/scheduler
# yarn
yarn add @botpress/scheduler
```

Once this is done you need to navigate to `http://localhost:3000/modules/scheduler`, from here you can create a new schedule.

1. Set the title - Click in the title text (`New Schedule 1`) and give your schedule a meaningful name, like `Wish Users Merry Xmas`

2. Set the time - Set the "Expression type" to "Once" and specify the date and time you want it to run, like `December 24, 2018 at 5:00pm`.

3. Set the action - This is the trickiest part. An action is block of code that will be executed at the specified time.

Below is an example snippet that asynchronously fetches all the userIds from the database and sends them your Christmas message.

> Note: Within this code you have access to `bp` and `task` variables.

```js
const knex = await bp.db.get()
const userIds = await knex('users')
  .distinct('userId')
  .pluck('userId')
const text = 'Hey! Wishing you Merry Christmas!'
return Promise.all(userIds.map(userId => bp.renderers.sendToUser(userId, '#builtin_text', { text, typing: true })))
```

> Note: in this example we are using `builtin_text` renderer which has to be registered properly.
