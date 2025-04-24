import * as sdk from '@botpress/sdk'

import { actions } from './actions'
import { channels } from './channels'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions,
  channels,
  handler: async (props) => {
    const {
      client,
      req: { body },
    } = props

    if (!body) {
      return {
        status: 400,
        body: JSON.stringify({ error: 'No body' }),
      }
    }

    let parsedBody: unknown
    try {
      parsedBody = JSON.parse(body)
    } catch {
      return {
        status: 400,
        body: JSON.stringify({ error: 'Invalid JSON Body' }),
      }
    }

    const parseResult = sdk.z
      .object({
        userId: sdk.z.string(),
        conversationId: sdk.z.string(),
        text: sdk.z.string(),
      })
      .safeParse(parsedBody)

    if (!parseResult.success) {
      return {
        status: 400,
        body: JSON.stringify({ error: 'Invalid body' }),
      }
    }

    const { userId, conversationId, text } = parseResult.data

    const { conversation } = await client.getOrCreateConversation({
      channel: 'webhook',
      tags: {
        id: conversationId,
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        id: userId,
      },
    })

    const { message } = await client.createMessage({
      type: 'text',
      conversationId: conversation.id,
      userId: user.id,
      payload: {
        text,
      },
      tags: {},
    })

    const response = {
      message,
    }

    return {
      status: 200,
      body: JSON.stringify(response),
    }
  },
})
