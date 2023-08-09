import axios, { Axios, AxiosResponse } from 'axios'
import { Buffer } from 'buffer'
import type { Customer, ConditionsData, Ticket, TicketRequester, Webhook, Trigger, TriggerNames } from './misc/types'

export const getTriggerTemplate = (name: TriggerNames) => ({
  type: name,
  agent: '{{current_user.email}}',
  comment: '{{ticket.latest_public_comment_html}}',
  ticketId: '{{ticket.id}}',
  currentUserId: '{{current_user.id}}',
  currentUserRole: '{{current_user.role}}',
  currentUserExternalId: '{{current_user.external_id}}',
})

export class ZendeskApi {
  private client: Axios
  constructor(baseURL: string, username: string, password: string) {
    const credentials = `${username}:${password}`

    const encodedCredentials = Buffer.from(credentials).toString('base64')

    const headers = {
      Authorization: `Basic ${encodedCredentials}`,
    }

    this.client = axios.create({
      baseURL,
      headers,
    })
  }

  public async findCustomers(query: string): Promise<Customer[]> {
    const res: AxiosResponse = await this.client.get(`/api/v2/users/search.json?query=${query}`)
    const { users } = res.data as { users: Customer[] }
    return users
  }
  public async getTicket(ticketId: string) {
    const res = await this.client.get(`/api/v2/tickets/${ticketId}.json`)
    const { ticket } = res.data as { ticket: Ticket }
    return ticket
  }

  public async createTicket(subject: string, comment: string, requester?: TicketRequester): Promise<Ticket> {
    const res: AxiosResponse = await this.client.post('/api/v2/tickets.json', {
      ticket: {
        subject,
        comment: { body: comment },
        requester,
      },
    })
    const { ticket } = res.data as { ticket: Ticket }
    return ticket
  }
  public async subscribeWebhook(webhookUrl: string): Promise<string> {
    const res: AxiosResponse = await this.client.post('/api/v2/webhooks', {
      webhook: {
        name: 'bpc_integration_webhook',
        status: 'active',
        endpoint: webhookUrl,
        http_method: 'POST',
        request_format: 'json',
        subscriptions: ['conditional_ticket_events'],
      },
    })
    const { webhook } = res.data as { webhook: Webhook }
    return webhook?.id
  }
  public async createTrigger(name: TriggerNames, subscriptionId: string, conditions: ConditionsData): Promise<string> {
    const res: AxiosResponse = await this.client.post('/api/v2/triggers.json', {
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
    const { trigger } = res.data as { trigger: Trigger }
    return trigger.id.toString()
  }
  public async deleteTrigger(triggerId: string): Promise<void> {
    try {
      await this.client.delete(`/api/v2/triggers/${triggerId}.json`)
    } catch {}
  }
  public async unsubscribeWebhook(subscriptionId: string): Promise<void> {
    try {
      await this.client.delete(`/api/v2/webhooks/${subscriptionId}`) // Do not add .json here
    } catch {}
  }

  public async createComment({ conversation, ack, content }: any) {
    const ticket = await this.updateTicket(conversation.id, {
      comment: {
        body: content,
        author_id: conversation.authorId,
      },
    })
    if (!ticket) {
      return
    }
    await ack({ tags: { id: `${ticket.id}` } })
  }

  public async updateTicket(ticketId: string, updateFields: object): Promise<Ticket> {
    const res: AxiosResponse = await this.client.put(`/api/v2/tickets/${ticketId}.json`, {
      ticket: updateFields,
    })

    const { ticket } = res.data as { ticket: Ticket }
    return ticket
  }

  public async getAvailableAgents(): Promise<Array<{ id: string; name: string; email: string }>> {
    const res: AxiosResponse = await this.client.get('/api/v2/users.json?role=agent')

    const agents = res.data.users.filter((user: any) => user.user_fields && user.user_fields.availability === 'online')

    return agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
    }))
  }

  public async updateUser(userId: number, fields: object): Promise<unknown> {
    // TODO: type me
    const res: AxiosResponse = await this.client.put(`/api/v2/users/${userId}.json`, {
      user: fields,
    })
    console.log('Updated user', res.data)
    return res.data.user
  }
}
