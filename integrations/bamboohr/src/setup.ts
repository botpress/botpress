import { BambooHRClient } from './api/bamboohr-client'
import * as bp from '.botpress'

export const register: bp.Integration['register'] = async (props) => {
  props.logger.forBot().info('Testing authorization to access BambooHR.')

  const bambooHrClient = await BambooHRClient.create(props)
  await bambooHrClient.testAuthorization(props)

  props.logger.forBot().info('BambooHR integration successfully registered.')

  // For events: add webhooks and save signing key
  // https://documentation.bamboohr.com/reference/post-webhook-2
}

export const unregister: bp.Integration['unregister'] = async (_) => {
  // For events: delete webhooks
  // https://documentation.bamboohr.com/reference/delete-webhook-2
}
