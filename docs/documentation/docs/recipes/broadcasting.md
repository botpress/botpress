---
id: broadcasting
title: Broadcasting
---

Broadcasting a message to your users is a common task for chatbots and is a great way to get your users to reengage.

There are two ways to achieve broadcasting. You can use the [`@botpress/scheduler`](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-scheduler) module, check out [this recipe](/docs/latest/recipes/scheduling/) for an example implementation, or you can use the [`@botpress/broadcast`](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-broadcast) module. The broadcast module is easier to use but lacks the flexibility of the scheduler module.

## Installation

You can install the `@botpress/broadcast` module by running:

```bash
# npm
npm i @botpress/broadcast
# yarn
yarn add @botpress/broadcast
```

Once it has been installed, you need to navigate to `http://localhost:3000/modules/broadcast`, from here you can create a new broadcast.

> Note: If no timezone information is available for the user, GMT will be used.

## Filtering users

You can apply filters to the broadcasts. Filters are small JavaScript functions that will be evaluated before sending a broadcast message to a user. You can add multiple filter functions and a user will be filtered out if any returns `false`.

Variables exposed to the filter function:

- `bp` botpress instance
- `userId` the userId to send the message to
- `platform` the platform on which the user is on

The function needs to return a **boolean** or a **Promise of a boolean**.

> Note: Starting your function with `return` is optional.

## Example Filter

Below is an example that returns `true` if a user first used the bot more than 3 days ago.

Because the `bp` instance will be available within a broadcasts filter, you can define your filter in your bot `index.js` file.

```js
bp.broadcastFilters = {
  userIsOld: userId => {
    const threeDaysBefore = new Date(new Date() - 3 * 24 * 60 * 60 * 1000)
    return bp.db.get().then(knex =>
      knex
        .where({ userId })
        .where('created_on', '<', threeDaysBefore.toISOString())
        .count('* as count')
        .then()
        .get(0)
        .then(({ count }) => count > 0)
    )
  }
}
```

Now that the filter method is defined you can now add it to your broadcast messages' filter conditions:

```js
bp.broadcastFilters.userIsOld(userId)
```
