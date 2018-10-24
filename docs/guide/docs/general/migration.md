---
id: migration
title: Migrating to Botpress XX
---

This guide will show you how to migrate your bot from Botpress X to Botpress XX.

## Bot content

1. Launch the new Botpress server
1. Create a bot with any name. Your bot files will be in `data/bots/bot-name/`
1. Copy the content of `generated/content` to `data/bots/bot-name/content-elements`
1. Copy the content of `generated/flows` to `data/bots/bot-name/flows`
1. Copy the content of `generated/intents` to `data/bots/bot-name/intents`
1. Copy the content of `generated/qna` to `data/bots/bot-name/qna`

If your bot is using `bp.dialogEngine.registerActions`, this is no longer supported in the new version. Each registered actions must be in a separate `.js` file in the folder `data/global/actions`.

If your bot has custom logic in `index.js`, such as in bp.hear, that concept has been changed. We replaced those with [hooks](../getting_started/hooks). They allow you to intercept events and tell Botpress how to handle them.

## Database

This will require some work on your side since there is no migration script at this time. We are only listing changes in the database.

### Table kvs

Table was renamed to srv_kvs. The column `botId` was added.

### Table web_conversations

Added column `botId`

### Table user_tags

This concept was deprecated, there is no replacement in XX

### Table users

The table is now called srv_channel users. Custom fields have been removed in favor of attributes.

Those are stored as JSON in the `attributes` column. It gives more flexibility if you want to add more data to users.

### Table notifications

Table was renamed `srv_notifications` and the column `botId` was added

### Table logs

Table renamed `srv_logs` and there are multiple columns that were changed.

### Table hitl_sessions

Added column `botId`
