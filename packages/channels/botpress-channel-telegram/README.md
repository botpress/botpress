# botpress-telegram

Official Telegram connector for Botpress. This module has been built to accelerate and facilitate development of Telegram bots.

## Contribution

Botpress Team would really appreciate to have some help from the community to work on this important module. By helping us, you will contribute to the core and by the way, you will become one of our **Botpress Leaders**!

## Installation

Installing modules on Botpress is simple. By using CLI, users only need to type this command in their terminal to add messenger module to their bot.

```js
botpress install telegram // Not publish yet on NPM
```

## Get started

To setup connexion of your chatbot to Messenger, you need to fill the connexion settings directly in the module interface. In fact, you only need to follow  steps and your bot will be active.

botfile.js
```js
config: {
    'botpress-telegram': {
      botToken: '451660170:AAHM2CD-Z8Kt3AwqcQLnaUgIk5bUJay3s0M'
    }
  }
```

You can also set the `TELEGRAM_TOKEN` environement variable


## Community

There's a [Slack community](https://slack.botpress.io) where you are welcome to join us, ask any question and even help others.

Get an invite and join us now! 👉[https://slack.botpress.io](https://slack.botpress.io)

## License

botpress-telegram is licensed under AGPLv3.
