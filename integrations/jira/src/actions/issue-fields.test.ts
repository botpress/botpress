import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  newIssue: vi.fn(),
  newIssues: vi.fn(),
  updateIssue: vi.fn(),
  getClient: vi.fn(),
}))

vi.mock('../utils', async () => {
  const actual = await vi.importActual<typeof import('../utils')>('../utils')
  return {
    ...actual,
    buildIssueRuntimeError: vi.fn((error: unknown) => error),
    getClient: mocks.getClient,
  }
})

import { newIssue } from './new-issue'
import { newIssues } from './new-issues'
import { updateIssue } from './update-issue'

const adf = (text: string) => ({
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text }],
    },
  ],
})

const baseProps = {
  ctx: {
    configuration: {
      host: 'https://example.atlassian.net',
      email: 'user@example.com',
      apiToken: 'token',
    },
  },
  logger: { forBot: () => ({ info: vi.fn(), debug: vi.fn() }) },
}

describe('issue action payloads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.newIssue.mockResolvedValue('SCRUM-17')
    mocks.newIssues.mockResolvedValue({ issues: [{ key: 'SCRUM-17' }], errors: [] })
    mocks.updateIssue.mockResolvedValue(undefined)
    mocks.getClient.mockReturnValue({
      newIssue: mocks.newIssue,
      newIssues: mocks.newIssues,
      updateIssue: mocks.updateIssue,
    })
  })

  it('omits optional create fields when they are not provided', async () => {
    await newIssue({
      ...baseProps,
      input: {
        summary: 'Investigate cleanup',
        projectKey: 'SCRUM',
        issueType: 'Task',
      },
    } as any)

    expect(mocks.newIssue).toHaveBeenCalledWith({
      fields: {
        summary: 'Investigate cleanup',
        project: { key: 'SCRUM' },
        issuetype: { name: 'Task' },
      },
    })
  })

  it('updates only the provided issue fields', async () => {
    await updateIssue({
      ...baseProps,
      input: {
        issueKey: 'SCRUM-17',
        summary: 'Renamed issue',
      },
    } as any)

    expect(mocks.updateIssue).toHaveBeenCalledWith({
      issueIdOrKey: 'SCRUM-17',
      fields: {
        summary: 'Renamed issue',
      },
    })
  })

  it('converts create descriptions to Jira ADF documents', async () => {
    await newIssue({
      ...baseProps,
      input: {
        summary: 'Investigate cleanup',
        description: 'Please investigate this.',
        projectKey: 'SCRUM',
        issueType: 'Task',
      },
    } as any)

    expect(mocks.newIssue).toHaveBeenCalledWith({
      fields: {
        summary: 'Investigate cleanup',
        description: adf('Please investigate this.'),
        project: { key: 'SCRUM' },
        issuetype: { name: 'Task' },
      },
    })
  })

  it('converts update descriptions to Jira ADF documents', async () => {
    await updateIssue({
      ...baseProps,
      input: {
        issueKey: 'SCRUM-17',
        description: 'Updated details.',
      },
    } as any)

    expect(mocks.updateIssue).toHaveBeenCalledWith({
      issueIdOrKey: 'SCRUM-17',
      fields: {
        description: adf('Updated details.'),
      },
    })
  })

  it('converts batch create descriptions to Jira ADF documents', async () => {
    await newIssues({
      ...baseProps,
      input: {
        issues: [
          {
            summary: 'Investigate cleanup',
            description: 'Batch details.',
            projectKey: 'SCRUM',
            issueType: 'Task',
          },
        ],
      },
    } as any)

    expect(mocks.newIssues).toHaveBeenCalledWith({
      issueUpdates: [
        {
          fields: {
            summary: 'Investigate cleanup',
            description: adf('Batch details.'),
            project: { key: 'SCRUM' },
            issuetype: { name: 'Task' },
          },
        },
      ],
    })
  })

  it('uses accountId for create assignee fields', async () => {
    await newIssue({
      ...baseProps,
      input: {
        summary: 'Assign on create',
        projectKey: 'SCRUM',
        issueType: 'Task',
        assigneeId: 'abc-123',
      },
    } as any)

    expect(mocks.newIssue).toHaveBeenCalledWith({
      fields: {
        summary: 'Assign on create',
        project: { key: 'SCRUM' },
        issuetype: { name: 'Task' },
        assignee: { accountId: 'abc-123' },
      },
    })
  })

  it('uses accountId for update assignee fields', async () => {
    await updateIssue({
      ...baseProps,
      input: {
        issueKey: 'SCRUM-17',
        assigneeId: 'abc-123',
      },
    } as any)

    expect(mocks.updateIssue).toHaveBeenCalledWith({
      issueIdOrKey: 'SCRUM-17',
      fields: {
        assignee: { accountId: 'abc-123' },
      },
    })
  })

  it('uses accountId for batch create assignee fields', async () => {
    await newIssues({
      ...baseProps,
      input: {
        issues: [
          {
            summary: 'Assign in batch',
            projectKey: 'SCRUM',
            issueType: 'Task',
            assigneeId: 'abc-123',
          },
        ],
      },
    } as any)

    expect(mocks.newIssues).toHaveBeenCalledWith({
      issueUpdates: [
        {
          fields: {
            summary: 'Assign in batch',
            project: { key: 'SCRUM' },
            issuetype: { name: 'Task' },
            assignee: { accountId: 'abc-123' },
          },
        },
      ],
    })
  })
})
