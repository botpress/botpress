import { RuntimeError } from '@botpress/sdk'
import { TodoistApi } from '@doist/todoist-api-typescript'
import * as bp from '.botpress'

export type CreateTaskArgs = {
  content: string
  description: string
  priority: Priority
  project_id?: string
  parentTaskId?: string
}

export type Task = bp.entities.task.Task

export type Comment = {
  id: string
  task_id: string
  content: string
}

export class Priority {
  public static readonly MAX = 4
  public static readonly MIN = 1

  // Value as seen by the user
  public constructor(private _value: number) {
    this._value = Math.min(Priority.MAX, _value)
    this._value = Math.max(Priority.MIN, _value)
  }

  public static fromApi(value: number): Priority {
    // API considers 4 as the highest priority
    return new Priority(Priority.MAX + 1 - value)
  }

  public toApi(): number {
    // API considers 4 as the highest priority
    return Priority.MAX + 1 - this._value
  }

  public toDisplay(): number {
    return this._value
  }
}

export class Client {
  public constructor(private _apiToken: string) {}

  public async getUserId(): Promise<string> {
    const api = new TodoistApi(this._apiToken)
    const project = await api.getProjects()
    // Assume there will be only one inbox project and it'll have the user
    // associated with the API token as its sole collaborator
    const inbox = project.filter((project) => project.isInboxProject)[0]
    if (!inbox) {
      throw new RuntimeError('Inbox project not found')
    }

    const user = (await api.getProjectCollaborators(inbox.id))[0]
    if (!user) {
      throw new RuntimeError('User owner of Inbox project not found')
    }
    return user.id
  }

  public async getTaskId(task_name: string): Promise<string | null> {
    const api = new TodoistApi(this._apiToken)
    const tasks = await api.getTasks()
    const task = tasks.find((task) => task.content === task_name)
    return task ? task.id : null
  }

  public async getProjectId(project_name: string): Promise<string | null> {
    const api = new TodoistApi(this._apiToken)
    const projects = await api.getProjects()
    const project = projects.find((project) => project.name === project_name)
    return project ? project.id : null
  }

  public async getTaskName(task_id: string): Promise<string> {
    const api = new TodoistApi(this._apiToken)
    const task = await api.getTask(task_id)
    return task.content
  }

  public async createTask(args: CreateTaskArgs): Promise<Task> {
    const api = new TodoistApi(this._apiToken)
    const task = await api.addTask({
      content: args.content,
      description: args.description,
      priority: args.priority.toApi(),
      projectId: args.project_id,
      parentId: args.parentTaskId,
    })
    return {
      id: task.id,
      content: task.content,
      description: task.description,
      priority: Priority.fromApi(task.priority).toDisplay(),
      projectId: task.projectId,
      parentTaskId: task.parentId ? task.parentId : undefined,
    }
  }

  public async changeTaskPriority(task_id: string, priority: Priority): Promise<void> {
    const api = new TodoistApi(this._apiToken)
    await api.updateTask(task_id, { priority: priority.toApi() })
  }

  public async createComment(task_id: string, content: string): Promise<Comment> {
    const api = new TodoistApi(this._apiToken)
    const comment = await api.addComment({
      taskId: task_id,
      content,
    })
    return {
      id: comment.id,
      task_id: comment.taskId!, // Comment was added to a task, so taskId is guaranteed to be defined
      content: comment.content,
    }
  }
}
