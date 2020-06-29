# @botpress/broadcast

## Get started

The broadcast module should now be available in your bot UI, and the APIs exposed.

## Features

### Send according to Users timezone

You can decide whether the scheduled time is absolute to the bot's time or to individual users. If no timezone information available for the user, GMT is chosen.

### Filtering

You can apply filters to the broadcasts. Filters are small JavaScript functions that will be evaluated before sending the broadcast to a user. The condition is called for every user the broadcast is scheduled to. You can add multiple filter functions and user will be filtered out if at least one of them returns `false`.

Variables exposed to the filter function:

- `bp` botpress instance
- `userId` the userId to send the message to
- `channel` the channel on which the user is on

The function needs to return a **boolean** or a **Promise of a boolean**.

**Note:** Starting your function with `return` is optional.

#### Examples

##### Send a message only to users on Facebook

```js
channel === 'facebook'
```

##### Use the botpress SDK to check the kvs

```js
bp.kvs.forBot('botName').get('keyName') === 'keyValue'
```

## API

### `GET /mod/broadcast/broadcasts`

Returns a list of the scheduled broadcasts.

### `PUT /mod/broadcast/broadcasts`

Schedules a new broadcast.

#### Body

```js
{
  botId: string, // *required*
  date: string, // *required*, 'YYYY-MM-DD'
  time: string, // *required*, 'HH:mm'
  timezone: null|int, // null (users timezone), or integer (absolute timezone)
  type: string, // *required*, 'text' or 'javascript'
  content: string // *required*, the text to be sent or the JavaScript code to execute,
  filters: [string] // filtering conditions, JavaScript code
}
```

### `POST /mod/broadcast/broadcasts`

Update an existing broadcast. Same as PUT except that `id` is also necessary. You can't modify a processing broadcast.

### `DELETE /mod/broadcast/broadcasts/:id`

Delete an existing broadcast. You can't delete a processing broadcast.

## License

botpress-broadcast is licensed under [AGPL-3.0](/LICENSE)
