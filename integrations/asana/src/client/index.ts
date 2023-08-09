import * as asana from 'asana'

export class AsanaApi {
  private client: asana.Client

  constructor(apiToken: string) {
    this.client = asana.Client.create({
      defaultHeaders: {
        'Asana-Enable': 'new_goal_memberships,new_user_task_lists',
      },
    }).useAccessToken(apiToken)
  }

  async createTask(
    task: asana.resources.Tasks.CreateParams & { workspace: string }
  ): Promise<asana.resources.Tasks.Type> {
    return await this.client.tasks.create(task)
  }

  async updateTask(taskId: string, task: asana.resources.Tasks.UpdateParams): Promise<asana.resources.Tasks.Type> {
    return await this.client.tasks.update(taskId, task)
  }

  async addCommentToTask(taskId: string, comment: string): Promise<asana.resources.Stories.Type> {
    return await this.client.tasks.addComment(taskId, { text: comment })
  }

  async findUser(userEmail: string): Promise<asana.resources.Users.Type> {
    return await this.client.users.findById(userEmail)
  }

  async findAllUsers(workspace: string): Promise<asana.resources.Users.Type[]> {
    const users = await this.client.users.findAll({ workspace })
    return users.data as asana.resources.Users.Type[]
  }
}
