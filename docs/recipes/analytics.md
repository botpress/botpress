---
layout: guide
---

When using a chatbot, you may be interested in analytics on its usage. This can be done via [@botpress/analytics](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-analytics) package.

To perform the basic setup, you need to install that package and initialize it by running something like this:

```js
const analytics = require('./analytics')
await analytics({ bp })
```

Once this is done, you should be able to see "Analytics" tab in your admin dashboard. Note analytics-tracking only starts from this moment, and it won't show analytics on past activity that wasn't recorded.

# Custom analytics

It may appear general analytics isn't enough for your needs and you need to track different activities.
This is also possible with this package.

Say we want to track the number of conversations users had and number of misunderstood messages they had.
Assuming you already have flows ready and working the task is quite simple.

First, we register diagrams that will be displayed as custom analytics. This can be done like this:

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

Parameters that `addGraph` accepts are described in [package README](https://github.com/botpress/botpress/tree/master/packages/functionals/botpress-analytics), but they should be pretty self-explaining.

Second, we need to trigger recording analytics within defined parts of your flow through actions. Here are example actions that you could use in this case:

```js
trackNewConversation: async (state, { bp, user }) => {
  await bp.analytics.custom.increment(`${'conversation'}~${user.id}`)
},

trackMisunderstood: async (state, { bp, user }) => {
  await bp.analytics.custom.increment(`${misunderstood}~${user.id}`)
}
```

You could also set up a more universal `track` action that you could use for multiple purposes. This could be like this:

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
