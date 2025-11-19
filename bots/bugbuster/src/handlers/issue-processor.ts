import { BotLogger } from '@botpress/sdk'
import { Issue, Pagination } from 'src/utils/graphql-queries'
import { LinearApi, StateKey } from 'src/utils/linear-utils'
import * as linlint from '../linear-lint-issue'
import { listTeams } from './teams-manager'
import { Client } from '.botpress'

const IGNORED_STATUSES: StateKey[] = ['TRIAGE', 'PRODUCTION_DONE', 'CANCELED', 'STALE']
const LINTIGNORE_LABEL_NAME = 'lintignore'

/**
 * @returns The corresponding issue, or `undefined` if the issue is not found or not valid.
 */
export async function findIssue(
  issueNumber: number,
  teamKey: string | undefined,
  logger: BotLogger,
  eventName: string,
  linear: LinearApi,
  client: Client,
  botId: string
): Promise<Issue | undefined> {
  if (!issueNumber || !teamKey) {
    logger.error('Missing issueNumber or teamKey in event payload')
    return
  }

  logger.info(`Linear issue ${eventName} event received`, `${teamKey}-${issueNumber}`)

  const teams = await listTeams(client, botId)
  if (!linear.isTeam(teamKey) || !teams.result?.includes(teamKey)) {
    logger.error(`Ignoring issue of team "${teamKey}"`)
    return
  }

  const issue = await linear.findIssue({ teamKey, issueNumber })
  if (!issue) {
    logger.error(`Issue with number ${issueNumber} not found in team ${teamKey}`)
    return
  }
  return issue
}

export async function listIssues(teams: string[], linear: LinearApi): Promise<Issue[]> {
  const validatedTeams = teams.filter((value) => linear.isTeam(value))

  const issues: Issue[] = []
  let pagination: Pagination | undefined

  do {
    const { issues: newIssues, pagination: newPagination } = await linear.listIssues(
      {
        teamKeys: validatedTeams,
        statusesToOmit: IGNORED_STATUSES,
      },
      pagination?.endCursor
    )

    issues.push(...newIssues)
    pagination = newPagination
  } while (pagination?.hasNextPage)

  return issues
}

export async function runLint(linear: LinearApi, issue: Issue, logger: BotLogger) {
  const status = linear.issueStatus(issue)
  if (IGNORED_STATUSES.includes(status) || issue.labels.nodes.some((label) => label.name === LINTIGNORE_LABEL_NAME)) {
    return
  }

  const errors = await linlint.lintIssue(issue, status)

  if (errors.length === 0) {
    logger.info(`Issue ${issue.identifier} passed all lint checks.`)
    await linear.resolveComments(issue)
    return
  }

  logger.warn(`Issue ${issue.identifier} has ${errors.length} lint errors:`)

  await linear.client.createComment({
    issueId: issue.id,
    body: [
      `BugBuster Bot found the following problems with ${issue.identifier}:`,
      '',
      ...errors.map((error: any) => `- ${error.message}`),
    ].join('\n'),
  })
}

export async function runLints(linear: LinearApi, issues: Issue[], logger: BotLogger) {
  for (const issue of issues) {
    await runLint(linear, issue, logger)
  }
}
