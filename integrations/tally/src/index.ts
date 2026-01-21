import { webhookSchema } from 'definitions/schemas/tally-events'
import { TallyApi } from './client'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, webhookUrl, logger, client }) => {
    const tallyApi = new TallyApi(ctx.configuration.apiKey)
    const formIds = ctx.configuration.formIds

    const { state } = await client.getOrSetState({
      type: 'integration',
      name: 'tallyIntegrationInfo',
      id: ctx.integrationId,
      payload: {
        tallyWebhookIds: {},
      },
    })
    const tallyWebhookIds: Record<string, string> = state.payload.tallyWebhookIds

    try {
      for (const formId of formIds) {
        if (tallyWebhookIds[formId]) {
          logger.info('Webhook already registered for form', { formId })
          continue
        }

        const created = await tallyApi.createWebhook({
          formId,
          url: webhookUrl,
          eventTypes: ['FORM_RESPONSE'],
          signingSecret: ctx.configuration.signingSecret,
        })

        tallyWebhookIds[formId] = created.id
        logger.info('Tally webhook registered', {
          formId,
          webhookId: created.id,
        })
      }

      await client.setState({
        type: 'integration',
        id: ctx.integrationId,
        name: 'tallyIntegrationInfo',
        payload: {
          tallyWebhookIds,
        },
      })
    } catch (error) {
      logger.forBot().error('Failed to create Tally webhook', error)
      throw error
    }
  },

  unregister: async ({ ctx, client, logger }) => {
    const { state } = await client.getOrSetState({
      type: 'integration',
      name: 'tallyIntegrationInfo',
      id: ctx.integrationId,
      payload: {
        tallyWebhookIds: {},
      },
    })
    const tallyWebhookIds: Record<string, string> = state.payload.tallyWebhookIds

    if (!tallyWebhookIds) {
      logger.warn('No Tally webhooks found in state')
      return
    }
    const tallyApi = new TallyApi(ctx.configuration.apiKey)

    for (const [formId, tallyWebhookId] of Object.entries(tallyWebhookIds)) {
      try {
        await tallyApi.deleteWebhook(tallyWebhookId)
        logger.info('Tally webhook deleted', { formId, tallyWebhookId })
      } catch (error) {
        logger.warn('Failed to delete Tally webhook', { formId, tallyWebhookId, error })
      }
    }
  },
  actions: {
    listSubmissions: async ({ ctx, input, logger }) => {
      const tallyApi = new TallyApi(ctx.configuration.apiKey)

      try {
        return await tallyApi.listSubmissions(input)
      } catch (error) {
        logger.warn('Error when listing submissions', { error })
        throw error
      }
    },
  },
  channels: {},
  handler: async ({ req, ctx, client, logger }) => {
    if (!req.body) {
      logger.warn('Event handler received an empty body')
      return
    }

    const data = JSON.parse(req.body)
    const parsed = webhookSchema.safeParse(data)
    if (!parsed.success) {
      logger.warn('Invalid Tally webhook payload', parsed.error)
      return { status: 400, body: 'invalid payload' }
    }

    const incomingFormId = parsed.data.data.formId
    const formIds = ctx.configuration.formIds

    if (!formIds.includes(incomingFormId)) {
      logger.info('Ignoring webhook for unconfigured form', { incomingFormId })
      return { status: 200, body: 'ignored' }
    }

    const fields = parsed.data.data.fields ?? []
    await client.createEvent({
      type: 'formSubmitted',
      payload: {
        formId: incomingFormId,
        fields,
      },
    })
    return { status: 200, body: 'ok' }
  },
})
