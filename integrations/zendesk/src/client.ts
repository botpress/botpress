import { z } from '@botpress/sdk'
import axios, { Axios, AxiosRequestConfig } from 'axios'
import type { ZendeskUser, ZendeskTicket, ZendeskWebhook } from './definitions/schemas'
import { ConditionsData, getTriggerTemplate, type TriggerNames } from './triggers'
import type { ZendeskEventType } from './webhookEvents'
import * as bp from '.botpress'

export type TicketRequester =
  | {
      name: string
      email: string
    }
  | {
      id: string
    }

export type Trigger = {
  url: string
  id: string
}

const makeBaseUrl = (organizationDomain: string) => {
  return organizationDomain.startsWith('https') ? organizationDomain : `https://${organizationDomain}.zendesk.com`
}

const makeUsername = (email: string) => {
  return email.endsWith('/token') ? email : `${email}/token`
}

type AxiosSummaryErrorProps = {
  request: {
    method: string
    baseUrl: string
    path: string
    query: string
  } | null
  response: {
    status: number
    statusText: string
    data: unknown
  }
}
class AxiosSummaryError extends Error {
  constructor(props: AxiosSummaryErrorProps) {
    const { request, response } = props
    const requestLine = request ? `${request.method} ${request.baseUrl}${request.path}${request.query}` : ''
    const message = [
      `Zendesk API error: ${response.status} ${response.statusText}`,
      requestLine,
      `Response: ${JSON.stringify(response.data)}`,
    ]
      .filter((x) => x)
      .join('\n')
    super(message)
  }
}

const axiosRequestSchema = z.object({
  method: z.string(),
  baseURL: z.string(),
  path: z.string(),
  params: z.record(z.string()).optional(),
})
const parseRequest = (request: any): AxiosSummaryErrorProps['request'] => {
  // for some reason request is not properly typed in axios error
  const parseResult = axiosRequestSchema.safeParse(request)
  if (!parseResult.success) {
    return null
  }
  const { method, baseURL, path, params } = parseResult.data
  return {
    method,
    baseUrl: baseURL,
    path,
    query: params ? `?${new URLSearchParams(params).toString()}` : '',
  }
}

/**
 * Axios Requests are too verbose and can pollute logs.
 * This function summarizes the error for better readability.
 */
const summerizeAxiosError = (thrown: unknown): never => {
  if (!axios.isAxiosError(thrown)) {
    throw thrown
  }
  const { response, request } = thrown
  throw new AxiosSummaryError({
    request: parseRequest(request),
    response: {
      status: response?.status ?? 0,
      statusText: response?.statusText ?? '',
      data: response?.data ?? {},
    },
  })
}

class ZendeskApi {
  private client: Axios
  constructor(organizationDomain: string, email: string, password: string) {
    this.client = axios.create({
      baseURL: makeBaseUrl(organizationDomain),
      withCredentials: true,
      auth: {
        username: makeUsername(email),
        password,
      },
    })
  }

  public async findCustomers(query: string): Promise<ZendeskUser[]> {
    const { data } = await this.client
      .get<{ users: ZendeskUser[] }>(`/api/v2/users/search.json?query=${query}`)
      .catch(summerizeAxiosError)
    return data.users
  }

  public async getTicket(ticketId: string) {
    const { data } = await this.client
      .get<{ ticket: ZendeskTicket }>(`/api/v2/tickets/${ticketId}.json`)
      .catch(summerizeAxiosError)
    return data.ticket
  }

  public async createTicket(subject: string, comment: string, requester: TicketRequester): Promise<ZendeskTicket> {
    const requesterPayload = 'id' in requester ? { requester_id: requester.id } : { requester }

    const { data } = await this.client
      .post<{ ticket: ZendeskTicket }>('/api/v2/tickets.json', {
        ticket: {
          subject,
          comment: { body: comment },
          ...requesterPayload,
        },
      })
      .catch(summerizeAxiosError)

    return data.ticket
  }

  public async subscribeWebhook(webhookUrl: string): Promise<string> {
    const { data } = await this.client
      .post<{ webhook: { id: string } }>('/api/v2/webhooks', {
        webhook: {
          name: 'bpc_integration_webhook',
          status: 'active',
          endpoint: webhookUrl,
          http_method: 'POST',
          request_format: 'json',
          subscriptions: ['conditional_ticket_events'],
        },
      })
      .catch(summerizeAxiosError)

    return data.webhook?.id
  }

  public async createTrigger(name: TriggerNames, subscriptionId: string, conditions: ConditionsData): Promise<string> {
    const { data } = await this.client
      .post<{ trigger: Trigger }>('/api/v2/triggers.json', {
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
      .catch(summerizeAxiosError)

    return `${data.trigger.id}`
  }

  public async deleteTrigger(triggerId: string): Promise<void> {
    await this.client.delete(`/api/v2/triggers/${triggerId}.json`).catch(summerizeAxiosError)
  }

  public async unsubscribeWebhook(subscriptionId: string): Promise<void> {
    await this.client.delete(`/api/v2/webhooks/${subscriptionId}`).catch(summerizeAxiosError)
  }

  public async createComment(ticketId: string, authorId: string, content: string): Promise<void> {
    await this.updateTicket(ticketId, {
      comment: {
        body: content,
        author_id: authorId,
      },
    }).catch(summerizeAxiosError)
  }

  public async updateTicket(ticketId: string | number, updateFields: object): Promise<ZendeskTicket> {
    const { data } = await this.client
      .put<{ ticket: ZendeskTicket }>(`/api/v2/tickets/${ticketId}.json`, {
        ticket: updateFields,
      })
      .catch(summerizeAxiosError)
    return data.ticket
  }

  public async getAgents(online?: boolean): Promise<ZendeskUser[]> {
    const { data } = await this.client
      .get<{ users: ZendeskUser[] }>('/api/v2/users.json?role[]=agent&role[]=admin')
      .catch(summerizeAxiosError)
    return online ? data.users.filter((user) => user.user_fields?.availability === 'online') : data.users
  }

  public async createOrUpdateUser(fields: Partial<ZendeskUser>): Promise<ZendeskUser> {
    const { data } = await this.client
      .post<{ user: ZendeskUser }>('/api/v2/users/create_or_update', {
        user: fields,
      })
      .catch(summerizeAxiosError)
    return data.user
  }

  public async updateUser(userId: number | string, fields: object): Promise<ZendeskUser> {
    const { data } = await this.client
      .put<{ user: ZendeskUser }>(`/api/v2/users/${userId}.json`, {
        user: fields,
      })
      .catch(summerizeAxiosError)
    return data.user
  }

  public async getUser(userId: number | string): Promise<ZendeskUser> {
    const { data } = await this.client
      .get<{ user: ZendeskUser }>(`/api/v2/users/${userId}.json`)
      .catch(summerizeAxiosError)
    return data.user
  }

  public async createArticleWebhook(webhookUrl: string, webhookId: string): Promise<void> {
    const subscriptions: ZendeskEventType[] = ['zen:event-type:article.published', 'zen:event-type:article.unpublished']

    await this.client
      .post('/api/v2/webhooks', {
        webhook: {
          endpoint: `${webhookUrl}/article-event`,
          http_method: 'POST',
          name: `bpc_article_event_${webhookId}`,
          request_format: 'json',
          status: 'active',
          subscriptions,
        },
      })
      .catch(summerizeAxiosError)
  }

  public async deleteWebhook(webhookId: string): Promise<void> {
    await this.client.delete(`/api/v2/webhooks/${webhookId}`).catch(summerizeAxiosError)
  }

  public async findWebhooks(params?: Record<string, string>): Promise<ZendeskWebhook[]> {
    const { data } = await this.client.get('/api/v2/webhooks', { params }).catch(summerizeAxiosError)

    return data.webhooks
  }

  public async makeRequest(requestConfig: AxiosRequestConfig) {
    const { data, headers, status } = await this.client.request(requestConfig).catch(summerizeAxiosError)

    return {
      data,
      headers: headers as Record<string, string>,
      status,
    }
  }
}

export const getZendeskClient = (config: bp.configuration.Configuration): ZendeskApi =>
  new ZendeskApi(config.organizationSubdomain, config.email, config.apiToken)
