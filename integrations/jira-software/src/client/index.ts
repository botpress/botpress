import { Version3Client, Version3Models, Version3Parameters } from 'jira.js'

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

  async updateIssue(issueUpdate: Version3Parameters.EditIssue): Promise<void> {
    await this.client.issues.editIssue(issueUpdate)
  }

  async addCommentToIssue(
    comment: Version3Parameters.AddComment
  ): Promise<string> {
    const { id } = await this.client.issueComments.addComment({
      issueIdOrKey: comment.issueIdOrKey,
      body: comment.body,
      expand: comment?.expand,
    })
    return id || ''
  }

  async findUser(accountId: string): Promise<Version3Models.User> {
    return await this.client.users.getUser({
      accountId,
    })
  }

  async findAllUser(
    addParams?: Version3Parameters.GetAllUsers
  ): Promise<Version3Models.User[]> {
    return await this.client.users.getAllUsers(addParams)
  }
}
