---
id: broadcast
title: Broadcast
---

--------------------

Automating bulk messaging is a widespread use case when communicating with a big audience. You may want to notify **all** chatbot users of an upcoming event. Sending a message from the HITL interface of your Botpress installation will likely be a lengthy, error-prone process. To help you out, we have created a broadcast module that takes care of this process. Let's take a closer look at this module.

![Broadcasting Module Interface](/assets/broadcast.png)

## Creating a Broadcast

To create a broadcast, click the **+ New Broadcast** button in the top right corner of the module UI. Botpress will present you with a window like the one below:

![New Broadcast](/assets/new-broadcast.png)

### Content

This button allows you to pick content. Once you click it, you can either create a new content element or select an existing one. This is the content that Botpress will send to chatbot users during the broadcast.

### Date

This is the date when that you will send the broadcast. You can schedule the broadcast for transmission on any future date.

### Time

This is the time when your chatbot sends the broadcast. You can schedule the broadcast to be sent at any future time. If no timezone information is available for the user, the default time will be in the GMT zone.

### Filtering

You can apply filters to the broadcasts. Filters are small JavaScript functions that your chatbot will evaluate before sending the broadcast to a user. Botpress calls this condition for every user scheduled to receive the broadcast. You can add multiple filter functions, and a user will be filtered out if at least one of them returns false.

#### Variables Exposed to the Filter Function

- `bp`: botpress instance;
- `userId`: the userId to send the message to;
- `channel`: the channel on which the user is on.

The function needs to return a boolean or a Promise of a boolean.

:::note
Starting your function with return is optional.
:::

#### Examples

Send a message only to users on Facebook:

```js
channel === 'facebook'
```

Use the Botpress SDK to check the kvs:

```js
bp.kvs.forBot('botName').get('keyName') === 'keyValue'
```

## Broadcast API

The broadcast API allows you to create and manage broadcasts without using the broadcast interface in Botpress Studio. The following API calls are available:

### Upcoming Broadcasts

You can get a list of scheduled broadcasts by sending a GET HTTP call. This command returns all the upcoming broadcasts:

```js
GET /mod/broadcast/broadcasts
```

### Scheduling with API

You can schedule a new broadcast by sending a PUT HTTP call to the broadcast module API route:

```js
PUT /mod/broadcast/broadcasts
```

### Body

Below is the schema of an HTTP call body:

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

### Updating an Existing Broadcast

The call for this operation is the same as scheduling, except that `id` is also necessary. You can't modify a processing broadcast.

```js
POST /mod/broadcast/broadcasts
```

### Delete a Broadcast

You can delete an existing broadcast using the delete HTTP call. You can't delete a processing broadcast.

```js
DELETE /mod/broadcast/broadcasts/:id
```
