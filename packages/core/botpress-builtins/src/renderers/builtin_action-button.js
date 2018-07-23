// TODO
// Add card support to Telegram

export default data => {
  if (data.action === 'Pick location') {
    throw new Error('Action-button renderers do not support "Pick location" type at the moment')
  }

  return [
    {
      on: 'facebook',
      template_type: 'generic',
      elements: [
        {
          title: data.title,
          buttons: [data.action].map(a => {
            if (a.action === 'Say something') {
              return {
                type: 'postback',
                title: a.title,
                payload: a.title
              }
            } else if (a.action === 'Open URL') {
              return {
                type: 'web_url',
                title: a.title,
                url: a.url
              }
            }
          })
        }
      ],

      typing: data.typing
    },
    {
      on: 'webchat',
      type: 'carousel',
      text: ' ',
      elements: [
        {
          title: data.title,
          buttons: [data.action].map(a => {
            if (a.action === 'Open URL') {
              return {
                title: a.title,
                url: a.url
              }
            } else {
              return {
                title: '<Unsupported action>'
              }
            }
          })
        }
      ],
      typing: data.typing
    },
    {
      on: 'microsoft',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.hero',
          content: {
            title: data.title,
            buttons: [data.action].map(a => {
              if (a.action === 'Say something') {
                return {
                  type: 'imBack',
                  title: a.title,
                  value: a.title
                }
              } else if (a.action === 'Open URL') {
                return {
                  type: 'openUrl',
                  title: a.title,
                  value: a.url
                }
              }
            })
          }
        }
      ]
    },
    {
      on: 'slack',
      attachments: [
        {
          title: data.title,
          text: data.subtitle,
          actions: [data.action].map(a => {
            if (a.action === 'Say something') {
              return {
                name: 'press',
                text: a.title,
                type: 'button',
                value: a.title
              }
            } else if (a.action === 'Open URL') {
              return {
                type: 'button',
                text: a.title,
                url: a.url
              }
            }
          })
        }
      ]
    }
  ]
}
