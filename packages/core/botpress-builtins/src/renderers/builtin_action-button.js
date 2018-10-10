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
          buttons: [data].map(a => {
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
            } else if (a.action === 'Share') {
              return {
                type: 'element_share'
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
          buttons: [data].map(a => {
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
            buttons: [data].map(a => {
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
          actions: [data].map(a => {
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
    },
    {
      on: 'telegram',
      title: data.title,
      options: {
        reply_markup: JSON.stringify({
          inline_keyboard: [data].map(d => {
            if (d.action === 'Say something') {
              return [
                {
                  text: d.title,
                  callback_data: d.title.substring(0, 64) // 1-64 bytes
                }
              ]
            } else if (d.action === 'Open URL') {
              return [
                {
                  text: d.title,
                  url: d.url
                }
              ]
            }
          })
        })
      }
    }
  ]
}
