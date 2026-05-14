import { RuntimeError } from '@botpress/sdk'
import type { Version3Models } from 'jira.js'
import { JiraApi } from '../client'
import { textToAdfDocument } from '../misc/adf'
import type { Config } from '../misc/types'

export const getClient = (config: Config) => new JiraApi(config.host, config.email, config.apiToken)

export { textToAdfDocument }

export const serializeErrorForLog = (error: unknown): string => {
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export const resolveIssueTypeIds = async (
  client: JiraApi,
  issues: Array<{ issueType: string; projectKey: string }>
): Promise<Map<string, string>> => {
  const projectKeys = new Set(issues.map((i) => i.projectKey))
  const key = (projectKey: string, typeName: string) => `${projectKey}::${typeName}`
  const nameToId = new Map<string, string>()

  for (const projectKey of projectKeys) {
    let response: Awaited<ReturnType<JiraApi['listIssueTypesForProject']>>
    try {
      response = await client.listIssueTypesForProject(projectKey)
    } catch (error) {
      throw buildRuntimeError(`Failed to resolve issue types for project "${projectKey}"`, error)
    }

    for (const issue of issues) {
      const mapKey = key(projectKey, issue.issueType)
      if (issue.projectKey !== projectKey || nameToId.has(mapKey)) continue
      const match = (response.issueTypes ?? []).find((t) => t.name === issue.issueType)
      if (!match?.id) {
        throw new RuntimeError(
          `Failed to resolve issue types: invalid issue type "${issue.issueType}" for project "${projectKey}". Use a Jira issue type that is valid for the target project.`
        )
      }
      nameToId.set(mapKey, match.id)
    }
  }

  return nameToId
}

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item): item is string => typeof item === 'string') ? value : undefined

const getStringRecord = (value: unknown): Record<string, string> | undefined => {
  if (!isRecord(value)) return undefined
  const entries = Object.entries(value)
  if (!entries.every((entry): entry is [string, string] => typeof entry[1] === 'string')) return undefined
  return Object.fromEntries(entries)
}

const getJiraError = (error: unknown): JiraErrorShape | undefined => {
  if (!isRecord(error)) return undefined

  const errors = getStringRecord(error.errors)
  const errorMessages = getStringArray(error.errorMessages)
  const status = typeof error.status === 'number' ? error.status : undefined
  const statusText = typeof error.statusText === 'string' ? error.statusText : undefined

  if (!errors && !errorMessages && status === undefined && statusText === undefined) return undefined
  return { errors, errorMessages, status, statusText }
}

export const getJiraErrorDetail = (error: unknown): string | undefined => {
  const jiraError = getJiraError(error)
  if (!jiraError) return undefined

  const fieldErrors = jiraError.errors ? Object.entries(jiraError.errors).map(([k, v]) => `${k}: ${v}`) : []
  const detail = [...(jiraError.errorMessages ?? []), ...fieldErrors].join('; ')
  return detail.length > 0 ? detail : undefined
}

export const getErrorMessage = (error: unknown): string =>
  getJiraErrorDetail(error) ?? (error instanceof Error ? error.message : serializeErrorForLog(error))

export const buildRuntimeError = (prefix: string, error: unknown): RuntimeError =>
  new RuntimeError(`${prefix}: ${getErrorMessage(error)}`)

export const buildIssueRuntimeError = (
  error: unknown,
  issueType: string | undefined,
  projectKey: string | undefined,
  verb: 'create' | 'update'
): RuntimeError => {
  const jiraError = getJiraError(error)
  const issueTypeError = jiraError?.errors?.issuetype
  if (issueTypeError && projectKey) {
    return new RuntimeError(
      `Failed to ${verb} issue: invalid issue type "${issueType ?? ''}" for project "${projectKey}". Use a Jira issue type that is valid for the target project. (Jira: ${issueTypeError})`
    )
  }
  const detail = getJiraErrorDetail(error)
  if (detail) {
    return new RuntimeError(`Failed to ${verb} issue: ${detail}`)
  }
  const message = error instanceof Error ? error.message : JSON.stringify(error)
  return new RuntimeError(`Failed to ${verb} issue: ${message}`)
}
