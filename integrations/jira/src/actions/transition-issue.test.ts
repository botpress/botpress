import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getIssueTransitions: vi.fn(),
  transitionIssue: vi.fn(),
  getClient: vi.fn(),
}))

vi.mock('../utils', async () => {
  const actual = await vi.importActual<typeof import('../utils')>('../utils')
  return {
    ...actual,
    getClient: mocks.getClient,
  }
})

import { getIssueTransitions } from './get-issue-transitions'
import { transitionIssue } from './transition-issue'

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

describe('issue transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getClient.mockReturnValue({
      getIssueTransitions: mocks.getIssueTransitions,
      transitionIssue: mocks.transitionIssue,
    })
  })

  it('flattens transitions returned from Jira', async () => {
    mocks.getIssueTransitions.mockResolvedValue({
      transitions: [
        {
          id: '21',
          name: 'In Progress',
          to: { name: 'In Progress', statusCategory: { name: 'In Progress' } },
          isAvailable: true,
          hasScreen: false,
        },
        { id: '31', name: 'Done', to: { name: 'Done', statusCategory: { name: 'Done' } } },
      ],
    })

    const result = await getIssueTransitions({
      ...baseProps,
      input: { issueKey: 'SCRUM-1' },
    } as any)

    expect(mocks.getIssueTransitions).toHaveBeenCalledWith(
      expect.objectContaining({ issueIdOrKey: 'SCRUM-1', includeUnavailableTransitions: true })
    )
    expect(result.transitions).toHaveLength(2)
    expect(result.transitions[0]).toMatchObject({
      id: '21',
      name: 'In Progress',
      toStatus: 'In Progress',
      toStatusCategory: 'In Progress',
      isAvailable: true,
    })
  })

  it('sends a transition payload with the expected shape', async () => {
    mocks.transitionIssue.mockResolvedValue(undefined)

    const result = await transitionIssue({
      ...baseProps,
      input: { issueKey: 'SCRUM-1', transitionId: '21' },
    } as any)

    expect(mocks.transitionIssue).toHaveBeenCalledWith({
      issueIdOrKey: 'SCRUM-1',
      transition: { id: '21' },
    })
    expect(result).toEqual({ issueKey: 'SCRUM-1', transitionId: '21' })
  })

  it('attaches a comment to the transition when provided', async () => {
    mocks.transitionIssue.mockResolvedValue(undefined)

    await transitionIssue({
      ...baseProps,
      input: { issueKey: 'SCRUM-1', transitionId: '21', comment: 'Starting work' },
    } as any)

    expect(mocks.transitionIssue).toHaveBeenCalledWith({
      issueIdOrKey: 'SCRUM-1',
      transition: { id: '21' },
      update: {
        comment: [{ add: { body: adf('Starting work') } }],
      },
    })
  })
})
