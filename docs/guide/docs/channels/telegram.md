---
id: telegram
title: Telegram
---

## Requirements

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

2. Restart Botpress and talk to your Telegram bot.

> **Tip**: Don't forget to set `enabled: true` in your config. Otherwise the module will be disabled for your bot.
