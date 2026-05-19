import * as sdk from '@botpress/sdk'
import { createFreshdeskRuntimeError } from './freshdesk-client/actions/errors'
import actions from './freshdesk-client/actions/implementations'
import { FreshdeskClient } from './freshdesk-client/FreshdeskClient'
import { handler } from './handler'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    const { domain, apiKey } = props.ctx.configuration
    const logger = props.logger.forBot()

    logger.info(`Validating Freshdesk configuration for domain=${domain}`)

    try {
      await new FreshdeskClient(domain, apiKey).validateCredentials()
      logger.info('Freshdesk configuration validated successfully')
    } catch (thrown) {
      const error = createFreshdeskRuntimeError(thrown)
      logger.warn('Freshdesk configuration validation failed', { error: error.message })
      throw new sdk.RuntimeError(`Invalid Freshdesk configuration: ${error.message}`)
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler,
})
