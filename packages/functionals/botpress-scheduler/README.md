# botpress-scheduler

Provides an interface and APIs to schedule one-off and recurring tasks.

**Support connectors:** This module is not dependent on any connector module

<img src='/packages/functionals/botpress-scheduler/assets/screenshot.jpg' height='300px'>

## Get started

```
npm install --save scheduler
```

The scheduler module should now be available in your bot UI, and the APIs exposed.
You can check [recipe](/docs/recipes/scheduling.md) with usage example.

## API

### `GET /api/botpress-scheduler/schedules/upcoming`

Returns a list of the upcoming schedules

### `GET /api/botpress-scheduler/schedules/past`

Returns a list of the past schedules (history)

### `PUT /api/botpress-scheduler/schedules`

Create a new schedule

```js
{
  id: 'string', // *required*, the unique name for the schedule
  enabled: true, // *required*, whether the schedule is enabled by default
  schedule_type: 'string', // *required*, can be "cron", "natural" or "once"
  schedule: 'string', // *required*, can be a 5-part cron expression, a natural string or a date
  action: 'string' // *required*, the code to execute in the task
}
```

### `PUT /api/botpress-scheduler/schedules`

Modify an existing schedule. Same arguments as the PUT.

### `DELETE /api/botpress-scheduler/schedules?id=SCHEDULE_ID`

Deletes an existing schedule. This also cancels any scheduled tasks for this schedule and delete the historical entries.

### `DELETE /api/botpress-scheduler/done`

Deletes all the historical tasks.

### Programmatic API

`scheduler` exposes `bp.scheduler.add` and `bp.scheduler.remove` functions as public API so that it can be used within other packages:

```js
await bp.scheduler.add({ 
  id: 'Test Notification',
  schedule: '2018-06-30T18:00:00.000Z',
  action: `bp.notifications.send({ level: 'success', message: 'Schedule triggered successfully' })`,
  enabled: true, // true by default
  scheduleType: 'once' // 'once' by default
})
await bp.scheduler.remove('Test Notification')
```

## Community

Pull requests are welcomed! We believe that it takes all of us to create something big and impactful.

There's a [Slack community](https://slack.botpress.io) where you are welcome to join us, ask any question and even help others.

Get an invite and join us now! 👉[https://slack.botpress.io](https://slack.botpress.io)

## License

botpress-scheduler is licensed under [AGPL-3.0](/LICENSE)
