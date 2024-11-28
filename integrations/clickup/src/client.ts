import axios, { AxiosInstance } from "axios";
const baseURL = "https://api.clickup.com/api/v2";

export class ClickUpClient {
  private axios: AxiosInstance;

  constructor(private token: string, private teamId: string) {
    this.axios = axios.create({
      baseURL,
      headers: { Authorization: token },
    });
  }

  async getUser() {
    const { data } = await this.axios.get("/user");
    return data.user;
  }

  async listWebhooks() {
    const { data } = await this.axios.get(`/team/${this.teamId}/webhook`);
    return data.webhooks;
  }

  async createWebhook(body: { endpoint: string; events: string[] }) {
    const { data } = await this.axios.post(`/team/${this.teamId}/webhook`, body);
    return data;
  }

  async updateWebhook({
    webhookId,
    ...body
  }: {
    webhookId: string;
    endpoint: string;
    events: string[];
    status: "active";
  }) {
    const { data } = await this.axios.put(`/webhook/${webhookId}`, body);
    return data;
  }

  async createComment({ taskId, text }: { taskId: string; text: string }) {
    const user = await this.getUser();
    const { data } = await this.axios.post(`/task/${taskId}/comment`, {
      comment_text: text,
      notify_all: false,
      assignee: user.id,
    });
    return data;
  }

  async createTask({
    name,
    listId,
    description,
    status,
    assignees,
    dueDate,
    tags,
  }: {
    name: string;
    listId: string;
    description?: string;
    status?: string;
    assignees?: number[];
    dueDate?: number;
    tags?: string[];
  }) {
    const { data } = await this.axios.post(`/list/${listId}/task`, {
      name,
      description,
      status,
      assignees,
      due_date: dueDate,
      tags,
    });
    return data;
  }

  async getTask(taskId: string) {
    const { data } = await this.axios.get(`/task/${taskId}`);
    return data;
  }

  async updateTask({
    taskId,
    name,
    description,
    status,
    archived,
    assignees,
    dueDate,
  }: {
    taskId: string;
    name?: string;
    description?: string;
    status?: string;
    archived?: boolean;
    assignees?: {add: number[]; rem: number[]};
    dueDate?: number;
  }) {
    const { data } = await this.axios.put(`/task/${taskId}`, {
      name,
      description,
      status,
      archived,
      assignees,
      due_date: dueDate,
    });
    return data;
  }

  async deleteTask({ taskId }: { taskId: string }) {
    const { data } = await this.axios.delete(`/task/${taskId}`);
    return data;
  }

  async getListMembers({ listId }: { listId: string }) {
    const { data } = await this.axios.get(`/list/${listId}/member`);
    return data.members;
  }
}
