import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  searchIssues: vi.fn(),
  getClient: vi.fn(),
}))

vi.mock('../utils', async () => {
  const actual = await vi.importActual<typeof import('../utils')>('../utils')
  return { ...actual, getClient: mocks.getClient }
})

import { searchIssues } from './search-issues'

const baseProps = {
  ctx: {
    configuration: { host: 'https://example.atlassian.net', email: 'u@x.com', apiToken: 't' },
  },
  logger: { forBot: () => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn() }) },
}

const makeIssue = (key: string) => ({
  id: '10001',
  key,
  fields: {
    summary: `${key} summary`,
    status: { name: 'To Do', statusCategory: { name: 'To Do' } },
    issuetype: { name: 'Task' },
    project: { key: 'SCRUM' },
    assignee: { accountId: 'abc-123', displayName: 'Ada' },
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-02T00:00:00.000Z',
  },
})

describe('searchIssues action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getClient.mockReturnValue({ searchIssues: mocks.searchIssues })
  })

  it('uses default JQL when none is provided', async () => {
    mocks.searchIssues.mockResolvedValue({ issues: [makeIssue('SCRUM-1')], isLast: true })
    const result = await searchIssues({ ...baseProps, input: {} } as any)
    expect(mocks.searchIssues).toHaveBeenCalledWith(
      expect.objectContaining({ jql: 'order by created DESC', maxResults: 50 })
    )
    expect(mocks.searchIssues).toHaveBeenCalledWith(expect.not.objectContaining({ nextPageToken: expect.anything() }))
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.issueKey).toBe('SCRUM-1')
    expect(result.nextToken).toBeUndefined()
  })

  it('returns nextToken when the response indicates more pages', async () => {
    mocks.searchIssues.mockResolvedValue({
      issues: [makeIssue('SCRUM-1'), makeIssue('SCRUM-2')],
      nextPageToken: 'cursor-abc',
      isLast: false,
    })
    const result = await searchIssues({
      ...baseProps,
      input: { jql: 'project = SCRUM', maxResults: 2 },
    } as any)
    expect(result.nextToken).toBe('cursor-abc')
  })

  it('forwards nextToken as nextPageToken on subsequent pages', async () => {
    mocks.searchIssues.mockResolvedValue({ issues: [makeIssue('SCRUM-51')], isLast: true })
    await searchIssues({ ...baseProps, input: { nextToken: 'cursor-xyz' } } as any)
    expect(mocks.searchIssues).toHaveBeenCalledWith(expect.objectContaining({ nextPageToken: 'cursor-xyz' }))
  })

  it('omits nextToken when isLast is true', async () => {
    mocks.searchIssues.mockResolvedValue({ issues: [], isLast: true, nextPageToken: 'ignored' })
    const result = await searchIssues({ ...baseProps, input: {} } as any)
    expect(result.items).toHaveLength(0)
    expect(result.nextToken).toBeUndefined()
  })

  it('omits nextToken when no pagination cursor is returned', async () => {
    mocks.searchIssues.mockResolvedValue({ issues: [makeIssue('SCRUM-1')] })
    const result = await searchIssues({ ...baseProps, input: {} } as any)
    expect(result.nextToken).toBeUndefined()
  })
})
