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
  // Register renderers
  bp.renderers.register('#welcome', () => [
    {
      typing: true,
      text: _.sample(['Hey there!', 'Hello {{user.first_name}}', 'Good day :)'])
    },
    {
      text: "This is just a regular Hello World, I don't do anything ;)",
      typing: '2s'
    },
    {
      text: "Make sure to check out the 'index.js' file to see how I work",
      typing: true
    },
    {
      wait: '5s'
    },
    {
      text: 'You can say goodbye now',
      typing: '1s'
    }
  ])

  bp.renderers.register('#goodbye', () => [
    {
      text: 'You are leaving because of reason {{reason}}',
      typing: true
    },
    'Hope to see you back again soon! :)' // if no other properties, you can just send a string
  ])

  // Listens for a first message (this is a Regex)
  // GET_STARTED is the first message you get on Facebook Messenger
  bp.hear(/GET_STARTED|hello|hi|test|hey|holla/i, (event, next) => {
    event.reply('#welcome')
  })

  // You can also pass a matcher object to better filter events
  bp.hear(
    {
      type: /message|text/i,
      text: /exit|bye|goodbye|quit|done|leave|stop/i
    },
    (event, next) => {
      event.reply('#goodbye', {
        reason: 'unknown'
      })
    }
  )
}
