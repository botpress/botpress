import { z } from '@botpress/sdk'
import actions from './actions'
import { N8nClient } from './client'
import * as bp from '.botpress'

const webhookPayloadSchema = z.object({
  conversationId: z.string().optional(),
  workflowId: z.string().optional(),
  workflowName: z.string().optional(),
  data: z.union([z.record(z.string(), z.any()), z.string()]).optional(),
})

const parseJsonBody = (body: unknown): unknown | null => {
  if (typeof body !== 'string') {
    return body
  }
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

export default new bp.Integration({
  register: async ({ ctx }) => {
    await new N8nClient(ctx.configuration).validateConnection()
  },
  unregister: async () => undefined,
  actions,
  channels: {},
  handler: async ({ req, client, logger }) => {
    const log = logger.forBot()

    const body = parseJsonBody(req.body)
    if (!body || typeof body !== 'object') {
      log.error('n8n webhook request must contain a valid JSON object body')
      return
    }

    const result = webhookPayloadSchema.safeParse(body)
    if (!result.success) {
      log.error('Invalid n8n webhook payload structure')
      return
    }

    const payload = result.data

    if (!payload.conversationId) {
      log.error('Missing conversationId in n8n webhook payload — ensure your n8n workflow echoes it back')
      return
    }

    let data: Record<string, any>
    if (typeof payload.data === 'string') {
      try {
        data = JSON.parse(payload.data)
      } catch {
        log.error('n8n webhook payload.data contained invalid JSON')
        return
      }
    } else if (typeof payload.data === 'object' && payload.data !== null) {
      data = payload.data
    } else {
      data = {}
    }

    try {
      await client.createEvent({
        type: 'n8nEvent',
        conversationId: payload.conversationId,
        payload: {
          workflowId: payload.workflowId,
          workflowName: payload.workflowName,
          data,
        },
      })
    } catch (err) {
      log.error(`Failed to create n8n event: ${err instanceof Error ? err.message : String(err)}`)
      return
    }

    return { status: 200, body: JSON.stringify({ ok: true }) }
  },
})
