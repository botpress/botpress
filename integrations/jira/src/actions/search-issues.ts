import { searchIssuesInputSchema, searchIssuesOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'

import { ISSUE_SEARCH_FIELDS, buildRuntimeError, flattenIssue, getClient, serializeErrorForLog } from '../utils'

const DEFAULT_MAX_RESULTS = 50
const HARD_MAX_RESULTS = 100
const DEFAULT_JQL = 'order by created DESC'

export const searchIssues: Implementation['actions']['searchIssues'] = async ({ ctx, input, logger }) => {
  const validatedInput = searchIssuesInputSchema.parse(input)
  const jiraClient = getClient(ctx.configuration)

  const maxResults = Math.min(validatedInput.maxResults ?? DEFAULT_MAX_RESULTS, HARD_MAX_RESULTS)
  const jql = validatedInput.jql && validatedInput.jql.trim().length > 0 ? validatedInput.jql : DEFAULT_JQL

  try {
    const response = await jiraClient.searchIssues({
      jql,
      maxResults,
      fields: ISSUE_SEARCH_FIELDS,
      ...(validatedInput.nextToken !== undefined && { nextPageToken: validatedInput.nextToken }),
    })

    const issues = response.issues ?? []
    const items = issues.map((issue) => flattenIssue(issue, ctx.configuration.host))
    const nextToken = response.isLast ? undefined : response.nextPageToken

    if (response.isLast === false && response.nextPageToken === undefined && items.length > 0) {
      logger
        .forBot()
        .warn('Search Issues: Jira reported isLast=false but returned no nextPageToken; pagination may be incomplete')
    }

    logger.forBot().info(`Successful - Search Issues - ${items.length} returned${nextToken ? ' (more available)' : ''}`)

    return searchIssuesOutputSchema.parse({ items, nextToken })
  } catch (error) {
    logger.forBot().debug(`'Search Issues' exception ${serializeErrorForLog(error)}`)
    throw buildRuntimeError('Failed to search issues', error)
  }
}
