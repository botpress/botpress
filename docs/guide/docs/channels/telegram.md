---
id: telegram
title: Telegram
---

## Requirements

- You have enabled `channel-telegram`. See [how to enable a module](../main/module)
- Use Telegram's BotFather to create a bot. Please refer to [How do I create a bot?](https://core.telegram.org/bots#3-how-do-i-create-a-bot)
- Have your Telegram bot token ready

## Setup

1. Create or edit this file `data/bots/<your_bot>/config/channel-telegram.json` and enter your Telegram bot token:

```json
{
  "botToken": "<your_bot_token>",
  "enabled": true
}
```

2. Set the `enabled` property to `true`. It lets you have control over which bot enable which module.

3. Restart Botpress and talk to your Telegram bot.
