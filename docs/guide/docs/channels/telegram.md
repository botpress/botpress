---
id: telegram
title: Telegram
---

## Requirements

The process for connecting to Telegram is simple. Firstly, you need to create a bot on Telegram. Thereafter, you can generate and access an authorization token, which you will use to connect your Telegram bot to your Botpress chatbot.  

### Create a bot
To create a bot on Telegram, use Telegram's BotFather.The BotFather will ask you for a name and username, then generate an authorization token for your new bot.

The name of your bot is displayed in contact details and elsewhere.

The Username is a short name to be used in mentions and t.me links. Usernames are 5-32 characters long and are case insensitive but may only include Latin characters, numbers, and underscores. Your bot's username must end in 'bot', e.g. 'tetris_bot' or 'TetrisBot'.

## Setup

### Generate an Authorisation Token
When you create a Telegram bot, Botfather will automatically generate a token. The token is a string that is required to authorize the bot and send requests to the Bot API. Keep your token secure and store it safely; anyone can use it to control your bot.

If your existing token is compromised or you lost it for some reason, use the /token command to generate a new one.

## Configuration

Create or edit the file `data/bots/<your_bot>/config/channel-telegram.json` and enter your Telegram bot token:

```json
{
  "botToken": "<your_bot_token>",
  "enabled": true
}
```

2. Restart Botpress and talk to your Telegram bot.

> **Tip**: Don't forget to set `enabled: true` in your config. Otherwise, the module will be disabled for your Botpress chatbot.
