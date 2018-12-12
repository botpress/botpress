---
id: version-11.2.0-channels
title: Messaging Channels
original_id: channels
---

## API Channel

Integrate Botpress to your current application with the API Channel. When you create a bot, the API Channel will automatically exposes an endpoint for the bot.

### How to use

`POST /api/v1/bots/{botId}/converse/{userId}` where **userId** is a unique string identifying a user that chats with your bot (**botId**).

### Request Body

```json
{
  "type": "text",
  "text": "Hey!"
}
```

### Optionnal Data

You can include more data to your response by using the `?include=nlu,state` query params.

Possible options:

- **nlu**: The output of Botpress NLU
- **state**: The state object of the user conversation

### API Response

This is a sample of the response given by the `welcome-bot` when its the first time you chat with it.

```json
{
  "responses": [
    {
      "type": "typing",
      "value": true
    },
    {
      "type": "text",
      "markdown": true,
      "text": "May I know your name please?"
    }
  ],
  "nlu": {
    "language": "en",
    "entities": [],
    "intent": {
      "name": "hello",
      "confidence": 1
    },
    "intents": [
      {
        "name": "hello",
        "confidence": 1
      }
    ]
  },
  "state": {}
}
```

## 🛠 Other channels

> **We are in the progress of adding many more channels to Botpress Server.**
>
> If you would like to help us with that, pull requests are welcomed!
