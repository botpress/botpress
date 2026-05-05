import { RuntimeError } from '@botpress/sdk'
import type { Version3Models } from 'jira.js'
import { JiraApi } from '../client'
import type { Config } from '../misc/types'

export const getClient = (config: Config) => new JiraApi(config.host, config.email, config.apiToken)

type FlattenedIssue = {
  issueKey: string
  id?: string
  browseUrl?: string
  summary?: string
  description?: string
  status?: string
  statusCategory?: string
  issueType?: string
  priority?: string
  projectKey?: string
  assigneeId?: string
  assigneeName?: string
  reporterId?: string
  reporterName?: string
  parentKey?: string
  created?: string
  updated?: string
}

const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0

const extractDescriptionText = (description: unknown): string | undefined => {
  if (typeof description === 'string') {
    return description
  }
  // Atlassian Document Format: walk text nodes.
  const collected: string[] = []
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; text?: string; content?: unknown[] }
    if (n.type === 'text' && isString(n.text)) {
      collected.push(n.text)
    }
    if (Array.isArray(n.content)) {
      n.content.forEach(walk)
    }
  }
  walk(description)
  const joined = collected.join(' ').trim()
  return joined.length > 0 ? joined : undefined
}

export const flattenIssue = (issue: Version3Models.Issue, host?: string): FlattenedIssue => {
  const fields = (issue.fields ?? {}) as Record<string, unknown>
  const status = fields.status as { name?: string; statusCategory?: { name?: string } } | undefined
  const issueType = fields.issuetype as { name?: string } | undefined
  const priority = fields.priority as { name?: string } | undefined
  const project = fields.project as { key?: string } | undefined
  const assignee = fields.assignee as { accountId?: string; displayName?: string } | undefined
  const reporter = fields.reporter as { accountId?: string; displayName?: string } | undefined
  const parent = fields.parent as { key?: string } | undefined

  return {
    issueKey: issue.key,
    id: issue.id,
    browseUrl: host && issue.key ? `${host.replace(/\/$/, '')}/browse/${issue.key}` : undefined,
    summary: isString(fields.summary) ? (fields.summary as string) : undefined,
    description: extractDescriptionText(fields.description),
    status: status?.name,
    statusCategory: status?.statusCategory?.name,
    issueType: issueType?.name,
    priority: priority?.name,
    projectKey: project?.key,
    assigneeId: assignee?.accountId,
    assigneeName: assignee?.displayName,
    reporterId: reporter?.accountId,
    reporterName: reporter?.displayName,
    parentKey: parent?.key,
    created: isString(fields.created) ? (fields.created as string) : undefined,
    updated: isString(fields.updated) ? (fields.updated as string) : undefined,
  }
}

export const ISSUE_SEARCH_FIELDS = [
  'summary',
  'description',
  'status',
  'issuetype',
  'priority',
  'project',
  'assignee',
  'reporter',
  'parent',
  'created',
  'updated',
]

type JiraErrorShape = {
  errors?: Record<string, string>
  errorMessages?: string[]
  status?: number
  statusText?: string
}

export const buildIssueRuntimeError = (
  error: unknown,
  issueType: string | undefined,
  projectKey: string | undefined,
  verb: 'create' | 'update'
): RuntimeError => {
  const jiraError = error as JiraErrorShape
  const issueTypeError = jiraError?.errors?.issuetype
  if (issueTypeError && projectKey) {
    return new RuntimeError(
      `Failed to ${verb} issue: invalid issue type "${issueType ?? ''}" for project "${projectKey}". Use a Jira issue type that is valid for the target project. (Jira: ${issueTypeError})`
    )
  }
  const fieldErrors = jiraError?.errors ? Object.entries(jiraError.errors).map(([k, v]) => `${k}: ${v}`) : []
  const detail = [...(jiraError?.errorMessages ?? []), ...fieldErrors].join('; ')
  if (detail) {
    return new RuntimeError(`Failed to ${verb} issue: ${detail}`)
  }
  const message = error instanceof Error ? error.message : JSON.stringify(error)
  return new RuntimeError(`Failed to ${verb} issue: ${message}`)
}
