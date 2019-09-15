---
id: version-11.8.1-analytics
title: Custom Analytics
original_id: analytics
---

Custom analytics is all about adding your own metrics. For instance, you could track the number of visitors, the number of customers and the number of customers referrals for your bot.

### Requirements

Make sure the `analytics` module is enabled in your `botpress.config.json`:

```json
{
  "location": "MODULES_ROOT/analytics",
  "enabled": true
},
```

## Graphs

### Register a graph

There are 4 types of graphs that you can use to display your metrics. You will need to register them in the `after_bot_mount` hook. The analytics module provide an example `00_custom_analytics.js` that you can uncomment to use as a template or to test how graphs works.

To register a graph, you need make a `post` request to the analytics module: `axios.post('/mod/analytics/graphs', graphDefinition, axiosConfig)`

### Graph Definition

`graphDefinition` is an object with following keys:

- name (String)
- type (one of 'count', 'countUniq', 'percent', 'piechart')
- description (String)
- variables ([String]),
- fn: (String function definition) that is used to calculate result - optional
- fnAvg: (String function definition) that gets used for 'percent' type to calculate average value - optional

### Types of graphs

#### Count

Display the total count of records for a metric.

```javascript
const countGraph = {
  name: 'Total Users',
  type: 'count',
  description: 'Total number of users',
  variables: ['user-type']
}
```

![Count](assets/custom-analytics-count.png)

#### CountUniq

Display the total of unique records for a metric.

```javascript
const countUniqGraph = {
  name: 'Total Customers',
  type: 'countUniq',
  description: 'Total number of customers',
  variables: ['user-type~customer']
}
```

![CountUniq](assets/custom-analytics-countuniq.png)

#### Percent

Display the percentage of x / y.

```javascript
const percentGraph = {
  name: 'Percentage of visitors',
  type: 'percent',
  sumValues: true,
  description: 'Percentage of visitors / total users',
  variables: ['user-type~visitor', 'user-type']
}
```

![Percent](assets/custom-analytics-percent.png)

#### Piechart

Display the proportion of each value for a metric.

```javascript
const pieChart = {
  name: 'Percentage of users per type',
  type: 'piechart',
  description: 'Percentage of users per type',
  variables: ['user-type']
}
```

![Piechart](assets/custom-analytics-piechart.png)

## Metrics

The analytics module provides three actions that you can use in your flows to set, increment or decrement your custom metrics.

![Analytics Actions](assets/custom-analytics-actions.png)

### Set

You can use `set` action to set a count for a specific metric.

### Increment

You can use `increment` to increment a specific metric by 1. You can set a bigger increment with the `increment` param.

### Decrement

You can use `decrement` to decrement a specific metric by 1. You can set a bigger increment with the `increment` param.
