# botpress-hitl

Official HITL (Human In The Loop) module for Botpress. This module has been built to easily track and write in your conversation when it's needed. By using this module, you can stop automatic responses of your bot and take control on any conversations.

**Support connectors: ** [botpress-messenger](https://github.com/botpress/botpress-messenger)

## Installation

Installing modules on Botpress is simple. By using CLI, users only need to type this command in their terminal to add messenger module to their bot.

```js
botpress install hitl
```

The HITL module should now be available in your bot UI, and the APIs exposed.

## Features

### Viewing conversations

By using this module, you can look to all your conversations at the same place. You don't have to use external connectors interface to follow your conversations.

<img src='/assets/hitl-screenshot.png' height='300px'>

### Filtering by status

You can filter conversations based on their status (paused/active) by using filtering button in the UI.

### Pausing/resuming conversations

You can pause or resume any conversations from the UI.

## API

### `POST /api/botpress-hitl/sessions/{$id}/pause`

Pause a specific conversation by using his `id`.

### `POST /api/botpress-hitl/sessions/{$id}/unpause`

Resume a conversation for a specific user.

## Example

A basic implementation example that shows how easy it is to implement a help request in Messenger.

```js
  const _ = require('lodash')

  module.exports = function(bp) {
    bp.middlewares.load()

    bp.hear(/HITL_START/, (event, next) => {
      bp.messenger.sendTemplate(event.user.id, {
        template_type: 'button',
        text: 'Bot paused, a human will get in touch very soon.',
        buttons: [{
          type: 'postback',
          title: 'Cancel request',
          payload: 'HITL_STOP'
        }]
      })

      bp.notifications.send({
        message: event.user.first_name + ' wants to talk to a human',
        level: 'info',
        url: '/modules/botpress-hitl'
      })
      bp.hitl.pause(event.platform, event.user.id)
    })

    bp.hear(/HITL_STOP/, (event, next) => {
      bp.messenger.sendText(event.user.id, 'Human in the loop disabled. Bot resumed.')
      bp.hitl.unpause(event.platform, event.user.id)
    })

    bp.hear({ type: 'message', text: /.+/i }, (event, next) => {
      bp.messenger.sendText(event.user.id, 'You said: ' + event.text)
    })
  }
```

**Note**: This is the only code you need to add to your bot in your `index.js` file.

## Roadmap

- Add pause bot in the UI
- Implement other types of message to view them in UI (template, buttons, etc.)

## Contribution

Botpress Team would really like to have some help from the community to work on this important module. By helping us, you will contribute to the core and by the way, you will become one of our **Botpress Leaders**!

## Community

There's a [Slack community](https://slack.botpress.io) where you are welcome to join us, ask any question and even help others.

Get an invite and join us now! 👉[https://slack.botpress.io](https://slack.botpress.io)

## License

botpress-hitl is licensed under AGPLv3.
