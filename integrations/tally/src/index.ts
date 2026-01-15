import * as bp from '.botpress'
import { TallyApi } from './client'
import { webhookSchema } from 'schemas/tally-events'

export default new bp.Integration({
  register: async ({ ctx, webhookUrl, logger, client }) => {
    const tallyApi = new TallyApi(ctx.configuration.apiKey)

    try {
      const created = await tallyApi.createWebhook({
        formId: ctx.configuration.formId,
        url: webhookUrl,
        eventTypes: ['FORM_RESPONSE'],
        signingSecret: ctx.configuration.signingSecret,
      })

      await client.setState({
        type: 'integration',
        id: ctx.integrationId,
        name: 'tallyIntegrationInfo',
        payload: {
          tallyWebhookId: created.id,
        },
      })

      logger.info('Tally webhook registered', {
        id: created.id,
        isEnabled: created.isEnabled,
        createdAt: created.createdAt,
      })
    } catch (error) {
      logger.forBot().error('Failed to create Tally webhook', error)
      throw error
    }
  },

  unregister: async ({ ctx, client, logger }) => {
    const { state } = await client.getState({
      type: 'integration',
      name: 'tallyIntegrationInfo',
      id: ctx.integrationId,
    })
    const tallyWebhookId = state.payload.tallyWebhookId

    if (!tallyWebhookId) {
      logger.warn('Tally WebhookId not found')
      return
    }

    try {
      const tallyApi = new TallyApi(ctx.configuration.apiKey)
      await tallyApi.deleteWebhook(tallyWebhookId)
      logger.info('Tally webhook deleted', { tallyWebhookId })
    } catch (error) {
      logger.warn('Failed to delete Tally webhook', { tallyWebhookId, error })
    }
  },
  actions: {},
  channels: {},
  handler: async ({ req, client, logger }) => {
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

    const fields = parsed.data.data.fields ?? []

    logger.info(JSON.stringify(fields, null, 2))

    await client.createEvent({
      type: 'formSubmitted',
      payload: { fields: fields },
    })

    return { status: 200, body: 'ok' }
  },
})
