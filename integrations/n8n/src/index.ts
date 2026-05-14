import * as sdk from '@botpress/sdk'
import axios from 'axios'
import actions from './actions'
import { getn8nClient } from './actions/utils'
import * as bp from '.botpress'

// handles both cases (parsed JSON or string)
const parseJsonBody = (body: unknown): unknown => {
  if (typeof body !== 'string') {
    return body
  }
  try {
    return JSON.parse(body)
  } catch {
    throw new sdk.RuntimeError('n8n webhook request contained invalid JSON')
  }
}

export default new bp.Integration({
  register: async ({ ctx }) => {
    const { baseUrl, accessKey } = ctx.configuration

    const n8nClient = getn8nClient({ baseUrl, accessKey })

    try {
      await n8nClient.get('/workflows', {
        params: {
          limit: 1,
          excludePinnedData: true,
        },
      })
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const code = err.code
        const message = status ? `n8n responded with HTTP ${status}` : code || err.message || 'network error'

        if (status === 401 || status === 403) {
          throw new sdk.RuntimeError(
            `Registration failed: authentication rejected (${message}). Check your Access Key and permissions.`
          )
        }

        if (status === 404) {
          throw new sdk.RuntimeError(
            `Registration failed: the n8n API was not found at ${baseUrl}/api/v1 (HTTP 404). Ensure your Base URL points to the root of your n8n instance (for example https://example.app.n8n.cloud).`
          )
        }

        throw new sdk.RuntimeError(
          `Registration failed: unable to reach n8n (${message}). Verify the Base URL is correct and reachable from this host.`
        )
      }

      const message = err instanceof Error ? err.message : String(err)
      throw new sdk.RuntimeError(`Registration failed: ${message}`)
    }
  },
  unregister: async () => undefined,
  actions,
  channels: {
    webhook: {
      messages: {
        text: async () => {},
      },
    },
  },
  handler: async ({ req, client }) => {
    const body = parseJsonBody(req.body)
    if (!body || typeof body !== 'object') {
      throw new sdk.RuntimeError('n8n webhook requests must contain a JSON body')
    }

    const payload = body as {
      conversationId?: string
      workflowId?: string
      workflowName?: string
      data?: Record<string, any>
    }

    const tagValue = payload.conversationId || crypto.randomUUID()
    let conversationId: string
    try {
      const result = await client.getOrCreateConversation({
        channel: 'webhook',
        tags: { conversationId: tagValue },
      })
      conversationId = result.conversation.id
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new sdk.RuntimeError(`Failed to get or create conversation: ${message}`)
    }

    let data: Record<string, any>
    if (typeof payload.data === 'string') {
      try {
        data = JSON.parse(payload.data)
      } catch {
        throw new sdk.RuntimeError('n8n webhook request contained invalid JSON in payload.data')
      }
    } else if (typeof payload.data === 'object' && payload.data !== null) {
      data = payload.data
    } else {
      data = {}
    }

    try {
      await client.createEvent({
        type: 'n8nEvent',
        payload: {
          workflowId: payload.workflowId,
          workflowName: payload.workflowName,
          conversationId: payload.conversationId,
          data,
        },
        conversationId,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new sdk.RuntimeError(`Failed to create n8n event: ${message}`)
    }

    return { status: 200, body: JSON.stringify({ ok: true }) }
  },
})
