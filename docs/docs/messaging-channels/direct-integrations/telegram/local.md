## Requirements

- An HTTPS Endpoint to your chatbot:

  - Set the `externalUrl` field in `botpress.config.json`
  - Create an HTTPS tunnel to your machine using Ngrok ([Tutorial](https://api.slack.com/tutorials/tunneling-with-ngrok)).
  - Using Nginx and Let's Encrypt ([Tutorial](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04)).

### Create a Bot

To create a bot on Telegram, use Telegram's [BotFather](https://t.me/botfather). The BotFather will ask you for a name and username, then generate an authorization token for your new bot.

The name of your bot is displayed in contact details and elsewhere.

The Username is a short name to be used in mentions and t.me links. Usernames are 5-32 characters long and are case insensitive but may only include Latin characters, numbers, and underscores. Your bot's username must end in `bot`, such as `tetris_bot` or `TetrisBot`.

## Setup {#cloud}

### Generate an Authorization Token

When you create a Telegram bot, Botfather will automatically generate a token. The token is a string that is required to authorize the bot and send requests to the Bot API. Keep your token secure and store it safely; anyone can use it to control your bot.

If your existing token is compromised or you lost it for some reason, use the `/token` command to generate a new one.

1. Edit `data/bots/<YOUR_BOT_ID>/bot.config.json`. In the `messaging.channels.telegram` section write this configuration :

- `enabled`: set to `true`
- `botToken`: your bot token

  Your `bot.config.json` should look like this:

```json
{
  // ... other data
  "messaging": {
    "channels": {
      "telegram": {
        "enabled": true,
        "botToken": "your_bot_token"
      }
      // ... other channels can also be configured here
    }
  }
}
```

1. Restart Botpress and talk to your Telegram bot. The webhook will be configured automatically to point to `<EXTERNAL_URL>/api/v1/messaging/webhooks/<YOUR_BOT_ID/telegram`.
