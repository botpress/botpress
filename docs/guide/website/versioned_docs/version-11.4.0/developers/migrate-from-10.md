---
id: version-11.4.0-migrate-from-10
title: Migrating from 10.X
original_id: migrate-from-10
---

## How to migrate your bots to 11.0

This guide will show you how to migrate your bot from Botpress X to Botpress Server.

### Bot content

1. Launch the new Botpress server
1. Create a bot with any name. Your bot files will be in `data/bots/bot-name/`
1. Copy the content of `generated/content` to `data/bots/bot-name/content-elements`
1. Copy the content of `generated/flows` to `data/bots/bot-name/flows`
1. Copy the content of `generated/intents` to `data/bots/bot-name/intents`
1. Copy the content of `generated/qna` to `data/bots/bot-name/qna`

If your bot is using `bp.dialogEngine.registerActions`, this is no longer supported in the new version. Each registered actions must be in a separate `.js` file in the folder `data/global/actions`.

If your bot has custom logic in `index.js`, such as in bp.hear, that concept has been changed. We replaced those with [hooks](../learn/hooks). They allow you to intercept events and tell Botpress how to handle them.

Content types are handled similarly, but the UI and Renderers are now bundled in a single file.

### Event parameters

One notable change is the standardization of event parameters. The term `platform` was replaced with `channel`, we now refer to a user/group with `target` and all other parameters related to the type of the event is stored in `payload`. When you send a message to a user, the payload is given to the content renderer, which returns the channel-specific payload.

```js
const event = {
  target: 'user1234',
  channel: 'web',
  type: 'text',
  payload: {
    text: 'Hello there',
    typing: true
  }
  preview: 'Hello there'
}
```

### Database

This will require some work on your side since there is no migration script at this time. We are only listing changes in the database.

#### Table kvs

Table was renamed to srv_kvs. The column `botId` was added.

#### Table web_conversations

Added column `botId`

#### Table user_tags

This concept was deprecated, there is no replacement in 11

#### Table users

The table is now called srv_channel users. Custom fields have been removed in favor of attributes.

Those are stored as JSON in the `attributes` column. It gives more flexibility if you want to add more data to users.

#### Table notifications

Table was renamed `srv_notifications` and the column `botId` was added

#### Table logs

Table renamed `srv_logs` and there are multiple columns that were changed.

#### Table hitl_sessions

Added column `botId`
