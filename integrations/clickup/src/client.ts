import axios, { AxiosInstance } from 'axios'
const baseURL = 'https://api.clickup.com/api/v2'

export class ClickUpClient {
  private _axios: AxiosInstance

  public constructor(
    private _token: string,
    private _teamId: string
  ) {
    this._axios = axios.create({
      baseURL,
      headers: { Authorization: _token },
    })
  }

  public async getUser() {
    const { data } = await this._axios.get('/user')
    return data.user
  }

  public async listWebhooks() {
    const { data } = await this._axios.get(`/team/${this._teamId}/webhook`)
    return data.webhooks
  }

  public async createWebhook(body: { endpoint: string; events: string[] }) {
    const { data } = await this._axios.post(`/team/${this._teamId}/webhook`, body)
    return data
  }

  public async updateWebhook({
    webhookId,
    ...body
  }: {
    webhookId: string
    endpoint: string
    events: string[]
    status: 'active'
  }) {
    const { data } = await this._axios.put(`/webhook/${webhookId}`, body)
    return data
  }

  public async createComment({ taskId, text }: { taskId: string; text: string }) {
    const user = await this.getUser()
    const { data } = await this._axios.post(`/task/${taskId}/comment`, {
      comment_text: text,
      notify_all: false,
      assignee: user.id,
    })
    return data
  }

  public async createTask({
    name,
    listId,
    description,
    status,
    assignees,
    dueDate,
    tags,
  }: {
    name: string
    listId: string
    description?: string
    status?: string
    assignees?: number[]
    dueDate?: number
    tags?: string[]
  }) {
    const { data } = await this._axios.post(`/list/${listId}/task`, {
      name,
      description,
      status,
      assignees,
      due_date: dueDate,
      tags,
    })
    return data
  }

  public async getTask(taskId: string) {
    const { data } = await this._axios.get(`/task/${taskId}`)
    return data
  }

  public async updateTask({
    taskId,
    name,
    description,
    status,
    archived,
    assignees,
    dueDate,
  }: {
    taskId: string
    name?: string
    description?: string
    status?: string
    archived?: boolean
    assignees?: { add: number[]; rem: number[] }
    dueDate?: number
  }) {
    const { data } = await this._axios.put(`/task/${taskId}`, {
      name,
      description,
      status,
      archived,
      assignees,
      due_date: dueDate,
    })
    return data
  }

  public async deleteTask({ taskId }: { taskId: string }) {
    const { data } = await this._axios.delete(`/task/${taskId}`)
    return data
  }

  public async getListMembers({ listId }: { listId: string }) {
    const { data } = await this._axios.get(`/list/${listId}/member`)
    return data.members
  }
}
