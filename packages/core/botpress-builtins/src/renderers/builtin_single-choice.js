import url from 'url'
import _ from 'lodash'

const SKIP_CHOICE_PREFIX = /^!skip |^!hide |^!hidden /i
const BUTTONS_PER_ROW = 2

const takeVisible = choices => {
  return (choices || []).filter(c => !SKIP_CHOICE_PREFIX.test(c.value) && !SKIP_CHOICE_PREFIX.test(c.title))
}

export default data => [
  {
    on: 'facebook',
    text: data.text,
    quick_replies: takeVisible(data.choices).map(c => `<${c.value}> ${c.title}`),
    typing: data.typing
  },
  {
    on: 'webchat',
    text: data.text,
    quick_replies: takeVisible(data.choices).map(c => `<${c.value}> ${c.title}`),
    typing: data.typing
  },
  {
    on: 'microsoft',
    type: 'message',
    text: data.text,
    inputHint: 'expectingInput',
    suggestedActions: {
      actions: takeVisible(data.choices).map(c => ({
        type: 'imBack',
        title: c.title,
        value: c.value
      }))
    }
  },
  {
    on: 'slack',
    attachments: [
      {
        text: data.text,
        attachment_type: 'default',
        actions: takeVisible(data.choices).map(c => ({
          name: 'press',
          text: c.title,
          type: 'button',
          value: c.value
        }))
      }
    ]
  },
  {
    on: 'telegram',
    text: data.text,
    reply_markup: {
      one_time_keyboard: true,
      resize_keyboard: true,
      selective: true,
      keyboard: _.chunk(takeVisible(data.choices).map(c => c.title), BUTTONS_PER_ROW)
    },
    typing: data.typing
  }
]
