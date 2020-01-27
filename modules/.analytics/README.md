# @botpress/analytics

Analytics for Botpress provides an interface to view graphs and data of your chatbot typical usage. By using this module, you can have a look to your total users, retention, daily active users, busy hours and a lot more...

## Usage

This module has some built-in analytics available from the box but also allows you to set up your own custom analytics. For latter you need to:

1. Register graphs within `after_bot_mount` hook (e.g. at `global/hooks/after_bot_mount/01_custom_analytics.js`) like this:

```js
const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
const graphDefinition = { /* ... */ }
axios.post('/mod/analytics/graphs', graphDefinition, axiosConfig)
```

`graphDefinition` is an object with following keys:

- name (String)
- type (one of 'count', 'countUniq', 'percent', 'piechart')
- description (String)
- variables ([String]),
- fn: (String function definition) that is used to calculate result - optional
- fnAvg: (String function definition) that gets used for 'percent' type to calculate average value - optional

2. Calling `increment`, `decrement` and `set` APIs within actions to register events that get displayed in analytics like this:

```js
const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
await axios.post('/mod/analytics/custom_metrics/set', { name: `${metric}~${value}`, count: 1 }, axiosConfig)
await axios.post('/mod/analytics/custom_metrics/increment', { name: `${metric}~${value}`, count: 1 }, axiosConfig)
await axios.post('/mod/analytics/custom_metrics/decrement', { name: `${metric}~${value}`, count: 1 }, axiosConfig)
```

## License

botpress-analytics is licensed under [AGPL-3.0](/LICENSE)
