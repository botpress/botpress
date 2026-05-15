import { RuntimeError } from '@botpress/sdk'
import type { RegisterFunction } from '../misc/types'
import { getClient } from '../utils'

export const register: RegisterFunction = async ({ client, ctx, logger }) => {
  const jiraClient = await getClient({ client, ctx, logger })
  try {
    await jiraClient.getCurrentUser()
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    throw new RuntimeError(`Invalid Jira configuration: ${message}`)
  }
}
