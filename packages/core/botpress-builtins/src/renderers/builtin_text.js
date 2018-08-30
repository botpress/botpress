const _ = require('lodash')

const SKIP_CHOICE_PREFIX = /^!skip |^!hide |^!hidden /i

const takeVisible = choices => {
  return (choices || []).filter(c => !SKIP_CHOICE_PREFIX.test(c.value) && !SKIP_CHOICE_PREFIX.test(c.title))
}

export default data =>
  data.actions && data.actions.length
    ? [
        {
          on: 'facebook',
          template_type: 'button',
          text: _.sample([data.text, ...(data.variations || [])]),
          buttons: data.actions.map(a => {
            if (a.action === 'Say something') {
              return {
                type: 'postback',
                title: a.title,
                payload: a.text
              }
            } else if (a.action === 'Open URL') {
              return {
                type: 'web_url',
                title: a.title,
                url: a.url,
                webview_height_ratio: a.webview_height_ratio,
                messenger_extensions: a.messenger_extensions
              }
            } else if (a.action === 'Click-to-Call') {
              return {
                type: 'phone_number',
                title: a.title,
                payload: a.phone_number
              }
            } else if (a.action === 'Pick location') {
              throw new Error('Messenger does not support "Pick location" action-buttons for carousels')
            }
          }),
          quick_replies: takeVisible(data.choices).map(c => `<${c.value || c.action}> ${c.title || c.action}`),
          typing: data.typing
        }
      ]
    : [
        {
          // on: '*',
          text: _.sample([data.text, ...(data.variations || [])]),
          quick_replies: takeVisible(data.choices).map(c => `<${c.value || c.action}> ${c.title || c.action}`),
          typing: data.typing,
          markdown: true // Webchat only
        }
      ]
