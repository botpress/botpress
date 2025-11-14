import { RuntimeError } from '@botpress/sdk'
import { HunterClient } from './client'
import { parseError } from './error-parser'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    try {
      const client = new HunterClient(ctx.configuration.apiKey)
      await client.getLeads()
      logger.forBot().info('Hunter.io integration configured successfully')
    } catch (error) {
      const parsed = parseError(error)
      throw new RuntimeError(`Failed to configure Hunter.io integration. Make sure the API key is valid: ${parsed}`)
    }
  },
  unregister: async ({ logger }) => {
    logger.forBot().info('Hunter.io integration unregistered')
  },
  actions: {
    getLeads: async ({ ctx, input, logger }) => {
      try {
        const hunterClient = new HunterClient(ctx.configuration.apiKey)

        const leads = await hunterClient.getLeads(input.search)

        logger.forBot().info('Leads got successfully from Hunter.io')

        return { leads }
      } catch (error) {
        throw new RuntimeError(parseError(error))
      }
    },
    retrieveLead: async ({ ctx, input, logger }) => {
      try {
        const hunterClient = new HunterClient(ctx.configuration.apiKey)

        const lead = await hunterClient.retrieveLead(input.id)

        logger.forBot().info(`Lead with ID ${input.id} retrieved successfully from Hunter.io`)

        return { lead }
      } catch (error) {
        throw new RuntimeError(parseError(error))
      }
    },
    createLead: async ({ ctx, input, logger }) => {
      try {
        const hunterClient = new HunterClient(ctx.configuration.apiKey)

        const lead = await hunterClient.createLead(input.lead)

        logger.forBot().info('Lead created successfully in Hunter.io')

        return { lead }
      } catch (error) {
        throw new RuntimeError(parseError(error))
      }
    },
    createOrUpdateLead: async ({ ctx, input, logger }) => {
      try {
        const hunterClient = new HunterClient(ctx.configuration.apiKey)

        const lead = await hunterClient.createOrUpdateLead(input.lead)

        logger.forBot().info('Lead created/updated successfully in Hunter.io')

        return { lead }
      } catch (error) {
        throw new RuntimeError(parseError(error))
      }
    },
    updateLead: async ({ ctx, input, logger }) => {
      try {
        const hunterClient = new HunterClient(ctx.configuration.apiKey)

        await hunterClient.updateLead(input.id, input.lead)

        logger.forBot().info(`Lead with ID ${input.id} updated successfully in Hunter.io`)

        return {}
      } catch (error) {
        throw new RuntimeError(parseError(error))
      }
    },
    deleteLead: async ({ ctx, input, logger }) => {
      try {
        const hunterClient = new HunterClient(ctx.configuration.apiKey)

        await hunterClient.deleteLead(input.id)

        logger.forBot().info(`Lead with ID ${input.id} deleted successfully from Hunter.io`)

        return {}
      } catch (error) {
        throw new RuntimeError(parseError(error))
      }
    },
  },
  channels: {},
  handler: async () => {},
})
