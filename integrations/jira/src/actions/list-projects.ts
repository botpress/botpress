import { RuntimeError } from '@botpress/sdk'

import { listProjectsInputSchema, listProjectsOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { buildRuntimeError, getClient, serializeErrorForLog } from '../utils'

const DEFAULT_MAX_RESULTS = 50
const HARD_MAX_RESULTS = 100

export const listProjects: Implementation['actions']['listProjects'] = async ({ ctx, input, logger }) => {
  const validatedInput = listProjectsInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  const startAt = validatedInput.nextToken ? Number(validatedInput.nextToken) : 0
  const maxResults = Math.min(validatedInput.maxResults ?? DEFAULT_MAX_RESULTS, HARD_MAX_RESULTS)

  if (!Number.isFinite(startAt) || startAt < 0) {
    throw new RuntimeError('Invalid nextToken: expected a non-negative integer string')
  }

  try {
    const response = await jiraClient.listProjects({
      startAt,
      maxResults,
      query: validatedInput.query,
      expand: 'description,lead',
    })

    const projects = response.values ?? []
    const items = projects.flatMap((p) => {
      if (!p.id || !p.key) return []
      return [
        {
          id: p.id,
          key: p.key,
          name: p.name,
          projectTypeKey: p.projectTypeKey,
          description: p.description,
          leadAccountId: p.lead?.accountId,
          leadName: p.lead?.displayName,
        },
      ]
    })

    const isLast = response.isLast ?? projects.length < maxResults
    const consumed = startAt + projects.length
    const nextToken = !isLast && projects.length > 0 ? String(consumed) : undefined

    logger.forBot().info(`Successful - List Projects - ${items.length} returned`)

    return listProjectsOutputSchema.parse({ items, nextToken })
  } catch (error) {
    logger.forBot().debug(`'List Projects' exception ${serializeErrorForLog(error)}`)
    throw buildRuntimeError('Failed to list projects', error)
  }
}
