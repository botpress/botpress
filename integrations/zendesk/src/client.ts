import axios, { Axios } from 'axios'
import type { Ticket, User } from './definitions/schemas'
import type { ConditionsData, TicketRequester, Trigger, TriggerNames } from './misc/types'
import type * as botpress from '.botpress'

export const getTriggerTemplate = (name: TriggerNames) => ({
  type: name,
  agent: '{{current_user.email}}',
  comment: '{{ticket.latest_public_comment_html}}',
  ticketId: '{{ticket.id}}',
  currentUser: {
    id: '{{current_user.id}}',
    name: '{{current_user.name}}',
    email: '{{current_user.email}}',
    external_id: '{{current_user.external_id}}',
    role: '{{current_user.role}}',
  },
})

class ZendeskApi {
  private client: Axios
  constructor(baseURL: string, username: string, password: string) {
    this.client = axios.create({
      baseURL,
      withCredentials: true,
      auth: {
        username,
        password,
      },
    })
  }

  public async findCustomers(query: string): Promise<User[]> {
    const { data } = await this.client.get<{ users: User[] }>(`/api/v2/users/search.json?query=${query}`)
    return data.users
  }

  public async getTicket(ticketId: string) {
    const { data } = await this.client.get<{ ticket: Ticket }>(`/api/v2/tickets/${ticketId}.json`)
    return data.ticket
  }

  public async createTicket(subject: string, comment: string, requester?: TicketRequester): Promise<Ticket> {
    const { data } = await this.client.post<{ ticket: Ticket }>('/api/v2/tickets.json', {
      ticket: {
        subject,
        comment: { body: comment },
        requester,
      },
    })

    return data.ticket
  }

  public async subscribeWebhook(webhookUrl: string): Promise<string> {
    const { data } = await this.client.post<{ webhook: { id: string } }>('/api/v2/webhooks', {
      webhook: {
        name: 'bpc_integration_webhook',
        status: 'active',
        endpoint: webhookUrl,
        http_method: 'POST',
        request_format: 'json',
        subscriptions: ['conditional_ticket_events'],
      },
    })

    return data.webhook?.id
  }

  public async createTrigger(name: TriggerNames, subscriptionId: string, conditions: ConditionsData): Promise<string> {
    const { data } = await this.client.post<{ trigger: Trigger }>('/api/v2/triggers.json', {
      trigger: {
        actions: [
          {
            field: 'notification_webhook',
            value: [subscriptionId, JSON.stringify(getTriggerTemplate(name), null, 2)],
          },
        ],
        conditions,
        title: `bpc_${name}`,
      },
    })

    return `${data.trigger.id}`
  }

  public async deleteTrigger(triggerId: string): Promise<void> {
    await this.client.delete(`/api/v2/triggers/${triggerId}.json`).catch(() => {})
  }

  public async unsubscribeWebhook(subscriptionId: string): Promise<void> {
    await this.client.delete(`/api/v2/webhooks/${subscriptionId}`).catch(() => {}) // Do not add .json here
  }

  public async createComment(ticketId: string, authorId: string, content: string): Promise<void> {
    await this.updateTicket(ticketId, {
      comment: {
        body: content,
        author_id: authorId,
      },
    })
  }

  public async updateTicket(ticketId: string | number, updateFields: object): Promise<Ticket> {
    const { data } = await this.client.put<{ ticket: Ticket }>(`/api/v2/tickets/${ticketId}.json`, {
      ticket: updateFields,
    })
    return data.ticket
  }

  public async getAvailableAgents(): Promise<User[]> {
    const { data } = await this.client.get<{ users: User[] }>('/api/v2/users.json?role=agent')
    return data.users.filter((user) => user.user_fields?.availability === 'online')
  }

  public async updateUser(userId: number | string, fields: object): Promise<User> {
    const { data } = await this.client.put<{ user: User }>(`/api/v2/users/${userId}.json`, {
      user: fields,
    })
    return data.user
  }
}

export const getZendeskClient = (config: botpress.configuration.Configuration) =>
  new ZendeskApi(config.baseURL, config.username, config.apiToken)
