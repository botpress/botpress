---
layout: guide
---

Broadcasting is a common task for chatbots. We've shown a recipe on how to do it via `@botpress/scheduler` package, but this can be achieved even easier (though less flexible) via `@botpress/broadcast` module.

To get started you just need to install this module (`npm install @botpress/broadcast`) and use it's interface to set up your first broadcasting message.

Note that except for content date and time you can also select whether the scheduled time is absolute to the bot's time or to individual users. If no timezone information available for the user, GMT is chosen.

## Filtering users

You can apply filters to the broadcasts. Filters are small JavaScript functions that will be evaluated before sending the broadcast to a user. The condition is called for every user the broadcast is scheduled to. You can add multiple filter functions and user will be filtered out if at least one of them returns `false`.

Variables exposed to the filter function:
- `bp` botpress instance
- `userId` the userId to send the message to
- `platform` the platform on which the user is on

The function needs to return a **boolean** or a **Promise of a boolean**.

**Note:** Starting your function with `return ` is optional.

## Example

Let's say we want to broadcast some message to users that were registered 3 days ago.

First we'd need to create a filter-function. Since `bp` instance will be available within filters, let's attach our filtering functions to it like this:

```js
// in your bot's index.js

bp.broadcastFilters = {
  userIsOld: userId => {
    const threeDaysBefore = new Date(new Date() - 3 * 24 * 60 * 60 * 1000)
    return bp.db.get()
      .then(knex =>
        .where({ userId })
        .where('created_on', '<', threeDaysBefore.toISOString())
        .count('* as count')
        .then().get(0).then(({ count }) => count > 0)
      )
  }
}
```

Once this is done you can add filter-condition to your broadcasts that would look like this:
```js
bp.broadcastFilters.userIsOld(userId)
```

This will broadcast message only to users that were created earlier then 3 days before now.
