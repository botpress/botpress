import { Version3Client, Version3Models, Version3Parameters } from 'jira.js'
import type { RequestConfig } from 'jira.js/out/requestConfig'

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
  private client: Version3Client

  constructor(host: string, email: string, apiToken: string) {
    this.client = new Version3Client({
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

  async newIssue(issue: Version3Parameters.CreateIssue): Promise<string> {
    const { key } = await this.client.issues.createIssue(issue)
    return key
  }

  async newIssues(payload: Version3Parameters.CreateIssues): Promise<Version3Models.CreatedIssues> {
    return await this.client.issues.createIssues(payload)
  }

  async updateIssue(issueUpdate: Version3Parameters.EditIssue): Promise<void> {
    await this.client.issues.editIssue(issueUpdate)
  }

  async assignIssue(issueIdOrKey: string, accountId: string | null): Promise<void> {
    const config: RequestConfig = {
      url: `/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}/assignee`,
      method: 'PUT',
      data: { accountId },
    }
    await this.client.sendRequest<void>(config, undefined as never)
  }

  async deleteIssue(issueIdOrKey: string, deleteSubtasks: boolean = false): Promise<void> {
    await this.client.issues.deleteIssue({
      issueIdOrKey,
      deleteSubtasks: String(deleteSubtasks) as 'true' | 'false',
    })
  }

  async getIssue(params: Version3Parameters.GetIssue): Promise<Version3Models.Issue> {
    return await this.client.issues.getIssue(params)
  }

  async searchIssues(params: EnhancedSearchRequest): Promise<EnhancedSearchResponse> {
    const config: RequestConfig = {
      url: '/rest/api/3/search/jql',
      method: 'POST',
      data: params,
    }
    return await this.client.sendRequest<EnhancedSearchResponse>(config, undefined as never)
  }

  async getIssueTransitions(params: Version3Parameters.GetTransitions): Promise<Version3Models.Transitions> {
    return await this.client.issues.getTransitions(params)
  }

  async transitionIssue(params: Version3Parameters.DoTransition): Promise<void> {
    await this.client.issues.doTransition(params)
  }

  async listProjects(params: Version3Parameters.SearchProjects): Promise<Version3Models.PageProject> {
    return await this.client.projects.searchProjects(params)
  }

  async listIssueTypesForProject(projectIdOrKey: string): Promise<CreateMetaIssueTypesPage> {
    const config: RequestConfig = {
      url: `/rest/api/3/issue/createmeta/${encodeURIComponent(projectIdOrKey)}/issuetypes`,
      method: 'GET',
    }
    return await this.client.sendRequest<CreateMetaIssueTypesPage>(config, undefined as never)
  }

  async countIssues(jql: string): Promise<number> {
    const config: RequestConfig = {
      url: '/rest/api/3/search/approximate-count',
      method: 'POST',
      data: { jql },
    }
    const response = await this.client.sendRequest<{ count: number }>(config, undefined as never)
    return response.count
  }

  async pickIssue(query: string, currentJql?: string): Promise<IssuePickerResponse> {
    const params = new URLSearchParams({ query })
    if (currentJql) params.set('currentJQL', currentJql)
    const config: RequestConfig = {
      url: `/rest/api/3/issue/picker?${params.toString()}`,
      method: 'GET',
    }
    return await this.client.sendRequest<IssuePickerResponse>(config, undefined as never)
  }

  async listProjectStatuses(projectIdOrKey: string): Promise<Version3Models.IssueTypeWithStatus[]> {
    return await this.client.projects.getAllStatuses(projectIdOrKey)
  }

  async addCommentToIssue(issueIdOrKey: string, body: string): Promise<string> {
    const { id } = await this.client.issueComments.addComment({
      issueIdOrKey,
      body,
    })
    if (!id) {
      throw new Error(`Jira did not return a comment ID for issue ${issueIdOrKey}`)
    }
    return id
  }

  async findUser(query: string): Promise<Version3Models.User> {
    const users = await this.client.userSearch.findUsers({
      query,
      maxResults: 1,
    })
    const user = users[0]
    if (!user) {
      throw new Error('Specified user does not exist or you do not have required permissions')
    }
    return user
  }

  async findAllUser(addParams?: Version3Parameters.GetAllUsers): Promise<Version3Models.User[]> {
    return await this.client.users.getAllUsers(addParams)
  }
}
