import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  newIssue: vi.fn(),
  updateIssue: vi.fn(),
  getClient: vi.fn(),
}))

vi.mock('../utils', () => ({
  buildIssueRuntimeError: vi.fn((error: unknown) => error),
  getClient: mocks.getClient,
}))

import { newIssue } from './new-issue'
import { updateIssue } from './update-issue'

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
    mocks.updateIssue.mockResolvedValue(undefined)
    mocks.getClient.mockReturnValue({
      newIssue: mocks.newIssue,
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
})
