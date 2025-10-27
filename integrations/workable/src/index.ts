import { RuntimeError, z } from '@botpress/sdk'
import { eventTypes } from 'definitions/events/candidates'
import { handler } from './handler'
import {
  fromGetCandidateInputModel,
  fromListCandidatesInputModel,
  toGetCandidateModel,
  toListCandidatesOutputModel,
} from './mapping/candidate-mapper'
import { WorkableClient } from './workable-api/client'
import * as bp from '.botpress'

async function _registerWebhook(
  client: WorkableClient,
  url: string,
  eventType: z.infer<typeof eventTypes>,
  subDomain: string
): Promise<number> {
  const response = await client.registerWebhook({
    // The query param is a workaround to allow registering the same url for each event.
    // The Workable API will not allow registering the same url string twice, even for different events.
    target: `${url}?event_type=${eventType}`,
    event: eventType,
    args: {
      account_id: subDomain,
      job_shortcode: '',
      stage_slug: '',
    },
  })
  return response.id
}

export default new bp.Integration({
  register: async (props) => {
    const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)
    try {
      const {
        state: {
          payload: { ids },
        },
      } = await props.client.getOrSetState({
        id: props.ctx.integrationId,
        name: 'webhooks',
        type: 'integration',
        payload: {
          ids: [],
        },
      })

      for (const id of ids) {
        await client.unregisterWebhook(id)
      }

      const newIds: number[] = []

      for (const eventType of eventTypes.options) {
        const id = await _registerWebhook(client, props.webhookUrl, eventType, props.ctx.configuration.subDomain)
        newIds.push(id)
      }

      await props.client.setState({
        id: props.ctx.integrationId,
        name: 'webhooks',
        type: 'integration',
        payload: {
          ids: newIds,
        },
      })
    } catch (thrown) {
      const msg = thrown instanceof Error ? thrown.message : String(thrown)
      throw new RuntimeError(`Failed to register the integration: ${msg}`)
    }
  },
  unregister: async (props) => {
    const {
      state: {
        payload: { ids },
      },
    } = await props.client.getState({
      name: 'webhooks',
      id: props.ctx.integrationId,
      type: 'integration',
    })
    const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)

    const errors: string[] = []

    for (const id of ids) {
      try {
        await client.unregisterWebhook(id)
      } catch (thrown) {
        errors.push(thrown instanceof Error ? thrown.message : String(thrown))
      }
    }
    if (errors.length > 0) {
      throw new RuntimeError(`Failed to unregister the integration: ${errors.join(', ')}`)
    }
  },
  actions: {
    listCandidates: async (props) => {
      const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)

      try {
        const raw = await client.listCandidates(fromListCandidatesInputModel(props.input))
        return toListCandidatesOutputModel(raw)
      } catch (thrown: unknown) {
        const msg = thrown instanceof Error ? thrown.message : String(thrown)
        throw new RuntimeError(`Failed to list candidates: ${msg}`)
      }
    },
    getCandidate: async (props) => {
      const client = new WorkableClient(props.ctx.configuration.apiToken, props.ctx.configuration.subDomain)

      try {
        const raw = await client.getCandidate(fromGetCandidateInputModel(props.input))
        return toGetCandidateModel(raw)
      } catch (thrown: unknown) {
        const msg = thrown instanceof Error ? thrown.message : String(thrown)
        throw new RuntimeError(`Failed to get candidate with id ${props.input.id}: ${msg}`)
      }
    },
  },
  channels: {},
  handler,
})
