import { RuntimeError } from '@botpress/sdk'
import type { RegisterFunction } from '../misc/types'
import { getClient } from '../utils'

export const register: RegisterFunction = async ({ ctx }) => {
  const jiraClient = getClient(ctx.configuration)
  try {
    await jiraClient.getCurrentUser()
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    throw new RuntimeError(`Invalid Jira configuration: ${message}`)
  }
}
