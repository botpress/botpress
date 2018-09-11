const SKIP_CHOICE_PREFIX = /^!skip |^!hide |^!hidden /i

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
    title: data.text,
    options: {
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        keyboard: [
          takeVisible(data.choices).map(choice => ({
            text: choice.title
          }))
        ],
        one_time_keyboard: true
      })
    }
  }
]
