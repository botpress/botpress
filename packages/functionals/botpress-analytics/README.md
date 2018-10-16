# @botpress/analytics

Analytics for Botpress provides an interface to view graphs and data of your chatbot typical usage. By using this module, you can have a look to your total users, retention, daily active users, busy hours and a lot more...

<img src='./assets/preview.png' width='300px'>

## Installation

```
npm install --save @botpress/analytics
```

## Usage

This module has some built-in analytics available from the box but also allows you to set up your own custom analytics.

For latter you need to:

1. Register graphs by calling `bp.analytics.custom.addGraph`
2. Calling `bp.analytics.custom.increment(name, count=1)` and `bp.analytics.custom.set(name, count=1)` to register events that get displayed in analytics

`bp.analytics.custom.addGraph` accepts an object with following keys:

- name (String)
- type (one of 'count', 'countUniq', 'percent', 'piechart', 'table')
- description (String)
- variables ([String]),
- fn: (Function that is used to calculate result)
- fnAvg: (Function) => that gets used for 'percent' type to calculate average value

## Examples

If you need some statistics about the satisfaction of your users, you can create 3 graphs : 2 counts and 1 table.

### Read events

To generate your graphs, create a new file inside `src` folder called `analytics.js`. 
Inside this file, call the `addGraph()` function :

```js
module.exports = async bp => {
    bp.analytics.custom.addGraph({
        name: '😃 users',
        type: 'count',
        description: 'Happy users',
        variables: ['happy']
    })

    bp.analytics.custom.addGraph({
        name: '😕 users',
        type: 'count',
        description: 'Mad users',
        variables: ['mad']
    })

    bp.analytics.custom.addGraph({
        name: 'Unsatisfied reasons',
        type: 'table',
        description: 'Why your users are mad?',
        variables: ['reason']
    })
}
```

and then you can call the `analytics.js` file inside the `index.js` file :

```js
const registerAnalytics = require('./analytics')

module.exports = async bp => {

    // ...
    // register functions
    // ...

    await registerAnalytics(bp)
}

```

### Send events

To send events, create nodes that passes inside functions that calls the botpress customs analytics functions :

Examples of functions inside the `actions.js` file :

```js
module.exports = {
    userIsHappy: async (state, { bp, user }, params) => {
        await bp.analytics.custom.increment(`happy~${user.id}`);
    },

    userIsMad: async (state, { bp, user }, params) => {
        await bp.analytics.custom.increment(`mad~${user.id}`);
    },

    satisfactionReason: async (state, event, { bp, user }) => {
        await bp.analytics.custom.set(`${event.text}~reason~${user.id}`);
    }
}
```

For more details, please read the [documentation](https://botpress.io/docs/latest/recipes/analytics/).

## License

botpress-analytics is licensed under [AGPL-3.0](/LICENSE)
