import type { Channels } from '../misc/types'

import { getClient } from '../utils'

export const channels: Channels = {
  channel: {
    messages: {
      text: async (props) => {
        const graphClient = getClient(props.ctx.configuration)
        await graphClient.replyLastMessage({
          ...props,
          body: {
            contentType: 'text',
            content: `${props.payload.text}\n\n${props.ctx.configuration.emailSignature}`,
          },
        })
      },
      choice: async (props) => {
        const graphClient = getClient(props.ctx.configuration)
        let content = `${props.payload.text}\n`

        for (const option of props.payload.options) {
          content += `- ${option.label}\n`
        }
        content += `\n\n${props.ctx.configuration.emailSignature}`
        await graphClient.replyLastMessage({
          ...props,
          body: {
            contentType: 'text',
            content,
          },
        })
      },
      dropdown: async (props) => {
        const graphClient = getClient(props.ctx.configuration)
        let content = `${props.payload.text}\n`

        for (const option of props.payload.options) {
          content += `- ${option.label}\n`
        }
        content += `\n\n${props.ctx.configuration.emailSignature}`
        await graphClient.replyLastMessage({
          ...props,
          body: {
            contentType: 'text',
            content,
          },
        })
      },
      html: async (props) => {
        const graphClient = getClient(props.ctx.configuration)
        await graphClient.replyLastMessage({
          ...props,
          body: {
            contentType: 'html',
            content: props.payload.content,
          },
        })
      },
    },
  },
}
