import { RuntimeError } from '@botpress/sdk'
import type { RegisterFunction } from '../misc/types'
import { getClient } from '../utils'

export const register: RegisterFunction = async ({ ctx }) => {
  /**
   * This is called when a bot installs the integration.
   * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
   */

  const jiraClient = getClient(ctx.configuration)
  try {
    await jiraClient.findAllUser({ maxResults: 1 })
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    throw new RuntimeError(`Invalid Jira configuration: ${message}`)
  }
}
