---
layout: guide
---

The [Botpress Analytics (@botpress/analytics)](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-analytics) package allows you to monitor the bots total user count, retention and lots more.

To perform the basic setup, you will need to install the package (`npm install --save @botpress/analytics`) and initialize it by adding the following snippet to your src/index.js file

```js
const analytics = require('./analytics')
await analytics({ bp })
```

Once this is done, you will be able to see the "Analytics" tab in your admin dashboard. Note analytics-tracking only starts from this moment, and it won't show analytics on past activity that wasn't recorded.

# Custom analytics

Should the default analytics not give you enough insight or you need to track a custom metric, you can add these within this package.

In the example below we are tracking the number of conversations users had and the number of times the bot misunderstood a message.
Assuming you already have your flows in place it is a simple task.

First, you register the diagrams that will be displayed as custom analytics:

```js
bp.analytics.custom.addGraph({
  name: 'Number of conversations',
  type: 'count',
  description: 'Number of conversations with each user',
  variables: ['conversation']
})

bp.analytics.custom.addGraph({
  name: 'Misunderstood Messages',
  type: 'percent',
  description: 'Percentage of misunderstood messages',
  variables: ['misunderstood', 'conversation'],
  fnAvg: (misunderstood, conversations) => misunderstood / conversations
})
```

Parameters that `addGraph` accepts are described in the [package README](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-analytics).

Secondly, you need to set up a trigger to record your custom analytics as a user interacts with your bot. Below we set up the two triggers needed for our new metrics set up above.

```js
trackNewConversation: async (state, { bp, user }) => {
  await bp.analytics.custom.increment(`${'conversation'}~${user.id}`)
},

trackMisunderstood: async (state, { bp, user }) => {
  await bp.analytics.custom.increment(`${'misunderstood'}~${user.id}`)
}
```

You could also set up a more universal `track` action that could used for multiple purposes:

```js
track: async (state, { bp }, { metric, value, unique }) => {
  if (value && value.length) {
    if (unique === 'true') {
      await bp.analytics.custom.set(`${metric}~${value}`, 1)
    } else {
      await bp.analytics.custom.increment(`${metric}~${value}`)
    }
  } else {
    await bp.analytics.custom.increment(`${metric}`)
  }
}
```
