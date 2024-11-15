import { handleErrorsDecorator as handleErrors, handleErrorsDecorator } from './error-handling'
import { RequestMapping, ResponseMapping } from './mapping'
import { TodoistApi } from '@doist/todoist-api-typescript'
import * as bp from '.botpress'
import { TodoistSyncClient } from './sync-client'
import { CreateTaskRequest, Project, Task, UpdateTaskRequest } from './types'
import { exchangeAuthCodeAndSaveRefreshToken, getAccessToken } from './oauth-client'

export class TodoistClient {
  private readonly _todoistRestClient: TodoistApi
  private readonly _todoistSyncClient: TodoistSyncClient

  private constructor({ accessToken }: { accessToken: string }) {
    this._todoistRestClient = new TodoistApi(accessToken)
    this._todoistSyncClient = new TodoistSyncClient({ accessToken })
  }

  public static async create({ client, ctx }: { client: bp.Client; ctx: bp.Context }) {
    const accessToken = await getAccessToken({ client, ctx })

    return new TodoistClient({ accessToken })
  }

  public static async authenticateWithAuthorizationCode({
    ctx,
    client,
    authorizationCode,
  }: {
    ctx: bp.Context
    client: bp.Client
    authorizationCode: string
  }) {
    await exchangeAuthCodeAndSaveRefreshToken({ ctx, client, authorizationCode })
  }

  @handleErrors('Failed to retrieve authenticated user')
  public getAuthenticatedUserId() {
    return this._todoistSyncClient.getAuthenticatedUserId()
  }

  @handleErrors('Failed to find task by name')
  public async getTaskByName({ name }: { name: string }): Promise<Task | null> {
    const tasks = await this._todoistRestClient.getTasks({ filter: `search: ${name}` })
    const matchingTask = tasks.find((task) => task.content === name)

    return matchingTask ? ResponseMapping.mapTask(matchingTask) : null
  }

  @handleErrors('Failed to find task by ID')
  public async getTaskById({ id }: { id: string }): Promise<Task> {
    const task = await this._todoistRestClient.getTask(id)

    return ResponseMapping.mapTask(task)
  }

  @handleErrors('Failed to find project by name')
  public async getProjectByName({ name }: { name: string }): Promise<Project | null> {
    const projects = await this._todoistRestClient.getProjects()
    const matchingProject = projects.find((project) => project.name === name)

    return matchingProject ? ResponseMapping.mapProject(matchingProject) : null
  }

  @handleErrors('Failed to find project by ID')
  public async getProjectById({ id }: { id: string }): Promise<Project> {
    const project = await this._todoistRestClient.getProject(id)

    return ResponseMapping.mapProject(project)
  }

  @handleErrors('Failed to create new task')
  public async createNewTask({ task }: { task: CreateTaskRequest }): Promise<Task> {
    const newTask = await this._todoistRestClient.addTask(RequestMapping.mapCreateTask(task))

    return ResponseMapping.mapTask(newTask)
  }

  @handleErrors('Failed to update task')
  public async updateTask({ task }: { task: UpdateTaskRequest }) {
    const updatedTask = await this._todoistRestClient.updateTask(task.id, RequestMapping.mapUpdateTask(task))

    return ResponseMapping.mapTask(updatedTask)
  }

  @handleErrors('Failed to comment on task')
  public async commentOnTask({ taskId, content }: { taskId: string; content: string }) {
    const newComment = await this._todoistRestClient.addComment({ taskId, content })

    return ResponseMapping.mapTaskComment(newComment)
  }
}
