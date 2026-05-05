import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  addComment: vi.fn(),
  createIssue: vi.fn(),
  createIssues: vi.fn(),
  editIssue: vi.fn(),
  deleteIssue: vi.fn(),
  getIssue: vi.fn(),
  getTransitions: vi.fn(),
  doTransition: vi.fn(),
  sendRequest: vi.fn(),
  findUsers: vi.fn(),
  getAllUsers: vi.fn(),
  searchProjects: vi.fn(),
  getAllStatuses: vi.fn(),
  getIssueAllTypes: vi.fn(),
}))

vi.mock('jira.js', () => ({
  Version3Client: vi.fn(() => ({
    issueComments: { addComment: mocks.addComment },
    issues: {
      createIssue: mocks.createIssue,
      createIssues: mocks.createIssues,
      editIssue: mocks.editIssue,
      deleteIssue: mocks.deleteIssue,
      getIssue: mocks.getIssue,
      getTransitions: mocks.getTransitions,
      doTransition: mocks.doTransition,
    },
    issueTypes: { getIssueAllTypes: mocks.getIssueAllTypes },
    projects: {
      searchProjects: mocks.searchProjects,
      getAllStatuses: mocks.getAllStatuses,
    },
    userSearch: { findUsers: mocks.findUsers },
    users: { getAllUsers: mocks.getAllUsers },
    sendRequest: mocks.sendRequest,
  })),
}))

import { JiraApi } from './index'

const newClient = () => new JiraApi('https://example.atlassian.net', 'user@example.com', 'token')

describe('JiraApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds issue comments from issue key and text', async () => {
    mocks.addComment.mockResolvedValue({ id: '10042' })
    const commentId = await newClient().addCommentToIssue('SCRUM-17', 'Please investigate this.')
    expect(mocks.addComment).toHaveBeenCalledWith({
      issueIdOrKey: 'SCRUM-17',
      body: {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Please investigate this.' }],
          },
        ],
      },
    })
    expect(commentId).toBe('10042')
  })

  it('finds the first matching user by query', async () => {
    mocks.findUsers.mockResolvedValue([{ accountId: 'abc-123', displayName: 'Ada Lovelace', active: true }])
    const user = await newClient().findUser('ada@example.com')
    expect(mocks.findUsers).toHaveBeenCalledWith({ query: 'ada@example.com', maxResults: 1 })
    expect(user.accountId).toBe('abc-123')
  })

  it('searches issues via the new /rest/api/3/search/jql endpoint', async () => {
    mocks.sendRequest.mockResolvedValue({ issues: [], isLast: true })
    await newClient().searchIssues({ jql: 'project = SCRUM', maxResults: 10 })
    const call = mocks.sendRequest.mock.calls[0]
    expect(call?.[0]).toMatchObject({
      url: '/rest/api/3/search/jql',
      method: 'POST',
      data: { jql: 'project = SCRUM', maxResults: 10 },
    })
  })

  it('forwards nextPageToken when paginating searchIssues', async () => {
    mocks.sendRequest.mockResolvedValue({ issues: [], isLast: true })
    await newClient().searchIssues({ jql: 'project = SCRUM', maxResults: 10, nextPageToken: 'abc' })
    const call = mocks.sendRequest.mock.calls[0]
    expect(call?.[0]).toMatchObject({
      url: '/rest/api/3/search/jql',
      method: 'POST',
      data: { jql: 'project = SCRUM', maxResults: 10, nextPageToken: 'abc' },
    })
  })

  it('forwards transition payloads to doTransition', async () => {
    mocks.doTransition.mockResolvedValue(undefined)
    await newClient().transitionIssue({ issueIdOrKey: 'SCRUM-1', transition: { id: '21' } })
    expect(mocks.doTransition).toHaveBeenCalledWith({ issueIdOrKey: 'SCRUM-1', transition: { id: '21' } })
  })

  it('lists projects via searchProjects', async () => {
    mocks.searchProjects.mockResolvedValue({ values: [], isLast: true })
    await newClient().listProjects({ startAt: 0, maxResults: 25 })
    expect(mocks.searchProjects).toHaveBeenCalledWith({ startAt: 0, maxResults: 25 })
  })

  it('batches issue creation via createIssues', async () => {
    mocks.createIssues.mockResolvedValue({ issues: [{ key: 'SCRUM-2' }], errors: [] })
    const result = await newClient().newIssues({
      issueUpdates: [{ fields: { summary: 'a', project: { key: 'SCRUM' }, issuetype: { name: 'Task' } } }],
    })
    expect(mocks.createIssues).toHaveBeenCalled()
    expect(result.issues).toEqual([{ key: 'SCRUM-2' }])
  })

  it('assigns an issue via PUT /issue/{key}/assignee', async () => {
    mocks.sendRequest.mockResolvedValue(undefined)
    await newClient().assignIssue('SCRUM-1', '712020:abc')
    const call = mocks.sendRequest.mock.calls[0]
    expect(call?.[0]).toMatchObject({
      url: '/rest/api/3/issue/SCRUM-1/assignee',
      method: 'PUT',
      data: { accountId: '712020:abc' },
    })
  })

  it('unassigns an issue when accountId is null', async () => {
    mocks.sendRequest.mockResolvedValue(undefined)
    await newClient().assignIssue('SCRUM-1', null)
    const call = mocks.sendRequest.mock.calls[0]
    expect(call?.[0]).toMatchObject({
      url: '/rest/api/3/issue/SCRUM-1/assignee',
      method: 'PUT',
      data: { accountId: null },
    })
  })

  it('deletes an issue, defaulting deleteSubtasks to false', async () => {
    mocks.deleteIssue.mockResolvedValue(undefined)
    await newClient().deleteIssue('SCRUM-1')
    expect(mocks.deleteIssue).toHaveBeenCalledWith({ issueIdOrKey: 'SCRUM-1', deleteSubtasks: 'false' })
  })

  it('passes deleteSubtasks=true when requested', async () => {
    mocks.deleteIssue.mockResolvedValue(undefined)
    await newClient().deleteIssue('SCRUM-1', true)
    expect(mocks.deleteIssue).toHaveBeenCalledWith({ issueIdOrKey: 'SCRUM-1', deleteSubtasks: 'true' })
  })

  it('lists issue types for a project via createmeta', async () => {
    mocks.sendRequest.mockResolvedValue({ issueTypes: [{ id: '1', name: 'Task' }] })
    const result = await newClient().listIssueTypesForProject('SCRUM')
    const call = mocks.sendRequest.mock.calls[0]
    expect(call?.[0]).toMatchObject({
      url: '/rest/api/3/issue/createmeta/SCRUM/issuetypes',
      method: 'GET',
    })
    expect(result.issueTypes).toEqual([{ id: '1', name: 'Task' }])
  })

  it('returns an approximate issue count', async () => {
    mocks.sendRequest.mockResolvedValue({ count: 42 })
    const count = await newClient().countIssues('project = SCRUM')
    const call = mocks.sendRequest.mock.calls[0]
    expect(call?.[0]).toMatchObject({
      url: '/rest/api/3/search/approximate-count',
      method: 'POST',
      data: { jql: 'project = SCRUM' },
    })
    expect(count).toBe(42)
  })

  it('queries the issue picker', async () => {
    mocks.sendRequest.mockResolvedValue({ sections: [] })
    await newClient().pickIssue('login bug')
    const call = mocks.sendRequest.mock.calls[0]
    expect(call?.[0]).toMatchObject({
      url: '/rest/api/3/issue/picker?query=login+bug',
      method: 'GET',
    })
  })

  it('forwards a scoping JQL to the issue picker', async () => {
    mocks.sendRequest.mockResolvedValue({ sections: [] })
    await newClient().pickIssue('login bug', 'project = SCRUM')
    const call = mocks.sendRequest.mock.calls[0]
    expect(call?.[0]).toMatchObject({
      url: '/rest/api/3/issue/picker?query=login+bug&currentJQL=project+%3D+SCRUM',
      method: 'GET',
    })
  })
})
