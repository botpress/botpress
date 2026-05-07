import * as sdk from '@botpress/sdk'
import { createOdooRuntimeError } from './odoo-client/actions/errors'
import actions from './odoo-client/actions/implementations'
import { OdooClient } from './odoo-client/OdooClient'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    const { url, apiKey, database } = props.ctx.configuration
    const logger = props.logger.forBot()

    logger.info(`Validating Odoo configuration for url=${url}, database=${database}`)

    try {
      const odooClient = new OdooClient(url, apiKey, database)
      const userId = await odooClient.getCurrentUserId()

      await props.client.setState({
        type: 'integration',
        id: props.ctx.integrationId,
        name: 'account',
        payload: { userId },
      })

      logger.info(`Odoo configuration validated for user id ${userId}`)
    } catch (thrown) {
      logger.warn('Odoo configuration validation failed', {
        error: thrown instanceof Error ? thrown.message : String(thrown),
      })
      throw new sdk.RuntimeError(`Invalid Odoo configuration: ${createOdooRuntimeError(thrown).message}`)
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
