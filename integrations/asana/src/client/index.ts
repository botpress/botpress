import * as asana from 'asana'

export class AsanaApi {
  private _client: asana.Client

  public constructor(apiToken: string) {
    this._client = asana.Client.create({
      defaultHeaders: {
        'Asana-Enable': 'new_goal_memberships,new_user_task_lists',
      },
    }).useAccessToken(apiToken)
  }

  public async createTask(
    task: asana.resources.Tasks.CreateParams & { workspace: string }
  ): Promise<asana.resources.Tasks.Type> {
    return await this._client.tasks.create(task)
  }

  public async updateTask(
    taskId: string,
    task: asana.resources.Tasks.UpdateParams
  ): Promise<asana.resources.Tasks.Type> {
    return await this._client.tasks.update(taskId, task)
  }

  public async addCommentToTask(taskId: string, comment: string): Promise<asana.resources.Stories.Type> {
    return await this._client.tasks.addComment(taskId, { text: comment })
  }

  public async findUser(userEmail: string): Promise<asana.resources.Users.Type> {
    return await this._client.users.findById(userEmail)
  }

  public async findAllUsers(workspace: string): Promise<asana.resources.Users.Type[]> {
    const users = await this._client.users.findAll({ workspace })
    return users.data as asana.resources.Users.Type[]
  }
}
