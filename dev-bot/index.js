/*
  CONGRATULATIONS on creating your first Botpress bot!

  This is the programmatic entry point of your bot.
  Your bot's logic resides here.

  Here's the next steps for you:
  1. Read this file to understand how this simple bot works
  2. Install a connector module (Facebook Messenger and/or Slack)
  3. Customize your bot!

  Happy bot building!

  The Botpress Team
  ----
  Getting Started (Youtube Video): https://www.youtube.com/watch?v=HTpUmDz9kRY
  Documentation: https://botpress.io/docs
  Our Slack Community: https://slack.botpress.io
*/

const _ = require('lodash')

module.exports = bp => {
  bp.renderers.register('#trivia-question', ({ BOT_URL, picture, question, choices }) => {
    const msgs = [
      {
        text: question,
        typing: true
      }
    ]

    picture &&
      msgs.push({
        type: 'file',
        url: BOT_URL + picture,
        text: 'N/A'
      })

    msgs.push({
      text: 'Make a choice',
      quick_replies: choices.map(({ text, payload }) => `<${payload}> ${text}`)
    })

    return msgs
  })

  bp.hear(/.+/i, (event, next) => {
    bp.dialogEngine.processMessage(event.sessionId || event.user.id, event).then()
  })
}
