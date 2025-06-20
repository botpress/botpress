import { RuntimeError } from '@botpress/sdk'
// @ts-ignore
import { DealsApi, DealsApiAddDealRequest, Configuration } from 'pipedrive/v2'
import qs from 'qs'
import * as wh from './webhook'
import * as bp from '.botpress'

const debugRequest = ({ req, logger }: bp.HandlerProps): void => {
  const { method, path, query, body } = req
  const fullPath = query ? `${path}?${query}` : path
  logger.forBot().debug(`Received webhook request: ${method} ${fullPath} ${JSON.stringify(body)}`)
}

export default new bp.Integration({
  register: async ({ ctx, webhookUrl }) => {
    await wh.createWebhook(ctx.configuration.apiKey, 'create', 'deal', `${webhookUrl}/createDeal`)
    await wh.createWebhook(ctx.configuration.apiKey, 'change', 'deal', `${webhookUrl}/changeDeal`)
    await wh.createWebhook(ctx.configuration.apiKey, 'delete', 'deal', `${webhookUrl}/deleteDeal`)

    await wh.createWebhook(ctx.configuration.apiKey, 'create', 'lead', `${webhookUrl}/createLead`)
    await wh.createWebhook(ctx.configuration.apiKey, 'change', 'lead', `${webhookUrl}/changeLead`)
    await wh.createWebhook(ctx.configuration.apiKey, 'delete', 'lead', `${webhookUrl}/deleteLead`)
  },
  unregister: async () => {
    // TODO: should use the deleteWebhook function to remove the webhooks; not sure how bp handle states in backend.
  },
  actions: {
    createDeal: async (props) => {
      const config = new Configuration({ apiKey: props.ctx.configuration.apiKey })
      const dealsApi = new DealsApi(config)
      const addDealRequest: DealsApiAddDealRequest = { AddDealRequest: { title: props.input.title } }
      try {
        const response = await dealsApi.addDeal(addDealRequest)
        props.logger.forBot().info('Deal created:', response.data)
        return { message: response.data?.title ?? ' Deal created successfully Deal creation failed' }
      } catch (error) {
        props.logger.error('Error creating deal:', error)
        throw error
      }
    },
  },
  channels: {},
  handler: async (props) => {
    debugRequest(props)

    const { req, client } = props
    const query = req.query ? qs.parse(req.query) : {}

    let body: unknown
    try {
      body = req.body ? JSON.parse(req.body) : {}
    } catch (thrown) {
      if (thrown instanceof SyntaxError) {
        const message = 'Invalid JSON body in request.'
        const error = new RuntimeError(message, thrown)
        props.logger.forBot().error(message, thrown)
        throw error
      }
      throw thrown
    }

    const parsedBody = wh.webhookPayloadSchema.safeParse(body)
    if (!parsedBody.success) {
      const message = 'Invalid webhook payload received.'
      const error = new RuntimeError(message, parsedBody.error)
      props.logger.forBot().error(message, parsedBody.error)
      throw error
    }

    const queryType: any = query['type']
    props.logger.forBot().debug(`Received webhook request: ${query}`)
    switch (queryType) {
      case 'createDeal':
        await client.createEvent({
          type: 'dealCreated',
          payload: parsedBody,
        })
        props.logger.forBot().debug('Botpress received webhook createDeal from pipedrive.')
        break
      case 'createLead':
        await client.createEvent({
          type: 'leadCreated',
          payload: parsedBody,
        })
        props.logger.forBot().debug('Botpress received webhook createLead from pipedrive.')
        break
      case 'changeDeal':
        await client.createEvent({
          type: 'dealChanged',
          payload: parsedBody,
        })
        props.logger.forBot().debug('Botpress received webhook changeDeal from pipedrive.')
        break
      case 'changeLead':
        await client.createEvent({
          type: 'leadChanged',
          payload: parsedBody,
        })
        props.logger.forBot().debug('Botpress received webhook changeLead from pipedrive.')
        break
      case 'deleteDeal':
        await client.createEvent({
          type: 'dealDeleted',
          payload: parsedBody,
        })
        props.logger.forBot().debug('Botpress received webhook deleteDeal from pipedrive.')
        break
      case 'deleteLead':
        await client.createEvent({
          type: 'leadDeleted',
          payload: parsedBody,
        })
        props.logger.forBot().debug('Botpress received webhook deleteLead from pipedrive.')
        break
      default:
        props.logger.warn('Unknown query type:', queryType)
    }

    return {
      status: 200,
    }
  },
})
