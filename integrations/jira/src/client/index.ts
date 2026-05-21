import { Version3Client, Version3Models, Version3Parameters } from 'jira.js'
import { textToAdfDocument } from '../misc/adf'

export type EnhancedSearchRequest = {
  jql: string
  nextPageToken?: string
  fields?: string[]
  fieldsByKeys?: boolean
  expand?: string
  properties?: string[]
  maxResults?: number
  reconcileIssues?: number[]
}

export type EnhancedSearchResponse = {
  issues?: Version3Models.Issue[]
  nextPageToken?: string
  isLast?: boolean
}

export type CreateMetaIssueTypesPage = {
  startAt?: number
  maxResults?: number
  total?: number
  issueTypes?: Array<{
    id?: string
    name?: string
    description?: string
    subtask?: boolean
    hierarchyLevel?: number
  }>
}

export type IssuePickerResponse = {
  sections?: Array<{
    id?: string
    label?: string
    sub?: string
    issues?: Array<{
      key?: string
      keyHtml?: string
      img?: string
      summary?: string
      summaryText?: string
    }>
  }>
}

export class JiraApi {
  private _client: Version3Client

  public constructor(host: string, email: string, apiToken: string) {
    this._client = new Version3Client({
      host,
      authentication: {
        basic: {
          email,
          apiToken,
        },
      },
      newErrorHandling: true,
    })
  }

  public async newIssue(issue: Version3Parameters.CreateIssue): Promise<string> {
    const { key } = await this._client.issues.createIssue(issue)
    return key
  }

  public async newIssues(payload: Version3Parameters.CreateIssues): Promise<Version3Models.CreatedIssues> {
    return await this._client.issues.createIssues(payload)
  }

  public async updateIssue(issueUpdate: Version3Parameters.EditIssue): Promise<void> {
    await this._client.issues.editIssue(issueUpdate)
  }

  public async getCurrentUser(): Promise<Version3Models.User> {
    return await this._client.myself.getCurrentUser()
  }

  public async assignIssue(issueIdOrKey: string, accountId: string | null): Promise<void> {
    await this._client.sendRequest<void>(
      {
        url: `/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}/assignee`,
        method: 'PUT',
        data: { accountId },
      },
      undefined as never
    )
  }

  public async deleteIssue(issueIdOrKey: string, deleteSubtasks: boolean = false): Promise<void> {
    await this._client.issues.deleteIssue({
      issueIdOrKey,
      deleteSubtasks: String(deleteSubtasks) as 'true' | 'false',
    })
  }

  public async getIssue(params: Version3Parameters.GetIssue): Promise<Version3Models.Issue> {
    return await this._client.issues.getIssue(params)
  }

  public async searchIssues(params: EnhancedSearchRequest): Promise<EnhancedSearchResponse> {
    return await this._client.sendRequest<EnhancedSearchResponse>(
      {
        url: '/rest/api/3/search/jql',
        method: 'POST',
        data: params,
      },
      undefined as never
    )
  }

  public async getIssueTransitions(params: Version3Parameters.GetTransitions): Promise<Version3Models.Transitions> {
    return await this._client.issues.getTransitions(params)
  }

  public async transitionIssue(params: Version3Parameters.DoTransition): Promise<void> {
    await this._client.issues.doTransition(params)
  }

  public async listProjects(params: Version3Parameters.SearchProjects): Promise<Version3Models.PageProject> {
    return await this._client.projects.searchProjects(params)
  }

  public async listIssueTypesForProject(projectIdOrKey: string): Promise<CreateMetaIssueTypesPage> {
    return await this._client.sendRequest<CreateMetaIssueTypesPage>(
      {
        url: `/rest/api/3/issue/createmeta/${encodeURIComponent(projectIdOrKey)}/issuetypes`,
        method: 'GET',
      },
      undefined as never
    )
  }

  public async countIssues(jql: string): Promise<number> {
    const response = await this._client.sendRequest<{ count: number }>(
      {
        url: '/rest/api/3/search/approximate-count',
        method: 'POST',
        data: { jql },
      },
      undefined as never
    )
    return response.count
  }

  public async pickIssue(query: string, currentJql?: string): Promise<IssuePickerResponse> {
    const params = new URLSearchParams({ query })
    if (currentJql) params.set('currentJQL', currentJql)
    return await this._client.sendRequest<IssuePickerResponse>(
      {
        url: `/rest/api/3/issue/picker?${params.toString()}`,
        method: 'GET',
      },
      undefined as never
    )
  }

  public async listProjectStatuses(projectIdOrKey: string): Promise<Version3Models.IssueTypeWithStatus[]> {
    return await this._client.projects.getAllStatuses(projectIdOrKey)
  }

  public async addCommentToIssue(issueIdOrKey: string, body: string): Promise<string> {
    const { id } = await this._client.issueComments.addComment({
      issueIdOrKey,
      body: textToAdfDocument(body),
    })
    if (!id) {
      throw new Error(`Jira did not return a comment ID for issue ${issueIdOrKey}`)
    }
    return id
  }

  public async findUser(query: string): Promise<Version3Models.User> {
    const users = await this._client.userSearch.findUsers({
      query,
      maxResults: 1,
    })
    const user = users[0]
    if (!user) {
      throw new Error('Specified user does not exist or you do not have required permissions')
    }
    return user
  }

  public async findAllUsers(addParams?: Version3Parameters.GetAllUsers): Promise<Version3Models.User[]> {
    return await this._client.users.getAllUsers(addParams)
  }
}
