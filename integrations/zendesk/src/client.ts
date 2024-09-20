import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import type { ZendeskUser, ZendeskTicket, ZendeskWebhook } from './definitions/schemas'
import { summarizeAxiosError } from './misc/axios-utils'
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

type AxiosRetryClient = Parameters<typeof axiosRetry>[0]

class ZendeskApi {
  private _client: AxiosInstance
  public constructor(organizationDomain: string, email: string, password: string) {
    this._client = axios.create({
      baseURL: makeBaseUrl(organizationDomain),
      withCredentials: true,
      auth: {
        username: makeUsername(email),
        password,
      },
    })

    axiosRetry(this._client as AxiosRetryClient, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        const rateLimitReached = error.response?.status === 429
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || rateLimitReached
      },
    })
  }

  public async findCustomers(query: string): Promise<ZendeskUser[]> {
    const { data } = await this._client
      .get<{ users: ZendeskUser[] }>(`/api/v2/users/search.json?query=${query}`)
      .catch(summarizeAxiosError)
    return data.users
  }

  public async getTicket(ticketId: string) {
    const { data } = await this._client
      .get<{ ticket: ZendeskTicket }>(`/api/v2/tickets/${ticketId}.json`)
      .catch(summarizeAxiosError)
    return data.ticket
  }

  public async createTicket(subject: string, comment: string, requester: TicketRequester): Promise<ZendeskTicket> {
    const requesterPayload = 'id' in requester ? { requester_id: requester.id } : { requester }

    const { data } = await this._client
      .post<{ ticket: ZendeskTicket }>('/api/v2/tickets.json', {
        ticket: {
          subject,
          comment: { body: comment },
          ...requesterPayload,
        },
      })
      .catch(summarizeAxiosError)

    return data.ticket
  }

  public async subscribeWebhook(webhookUrl: string): Promise<string> {
    const { data } = await this._client
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
      .catch(summarizeAxiosError)

    return data.webhook?.id
  }

  public async createTrigger(name: TriggerNames, subscriptionId: string, conditions: ConditionsData): Promise<string> {
    const { data } = await this._client
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
      .catch(summarizeAxiosError)

    return `${data.trigger.id}`
  }

  public async deleteTrigger(triggerId: string): Promise<void> {
    await this._client.delete(`/api/v2/triggers/${triggerId}.json`).catch(summarizeAxiosError)
  }

  public async unsubscribeWebhook(subscriptionId: string): Promise<void> {
    await this._client.delete(`/api/v2/webhooks/${subscriptionId}`).catch(summarizeAxiosError)
  }

  public async createComment(ticketId: string, authorId: string, content: string): Promise<void> {
    await this.updateTicket(ticketId, {
      comment: {
        body: content,
        author_id: authorId,
      },
    }).catch(summarizeAxiosError)
  }

  public async updateTicket(ticketId: string | number, updateFields: object): Promise<ZendeskTicket> {
    const { data } = await this._client
      .put<{ ticket: ZendeskTicket }>(`/api/v2/tickets/${ticketId}.json`, {
        ticket: updateFields,
      })
      .catch(summarizeAxiosError)
    return data.ticket
  }

  public async getAgents(online?: boolean): Promise<ZendeskUser[]> {
    const { data } = await this._client
      .get<{ users: ZendeskUser[] }>('/api/v2/users.json?role[]=agent&role[]=admin')
      .catch(summarizeAxiosError)
    return online ? data.users.filter((user) => user.user_fields?.availability === 'online') : data.users
  }

  public async createOrUpdateUser(fields: Partial<ZendeskUser>): Promise<ZendeskUser> {
    const { data } = await this._client
      .post<{ user: ZendeskUser }>('/api/v2/users/create_or_update', {
        user: fields,
      })
      .catch(summarizeAxiosError)
    return data.user
  }

  public async updateUser(userId: number | string, fields: object): Promise<ZendeskUser> {
    const { data } = await this._client
      .put<{ user: ZendeskUser }>(`/api/v2/users/${userId}.json`, {
        user: fields,
      })
      .catch(summarizeAxiosError)
    return data.user
  }

  public async getUser(userId: number | string): Promise<ZendeskUser> {
    const { data } = await this._client
      .get<{ user: ZendeskUser }>(`/api/v2/users/${userId}.json`)
      .catch(summarizeAxiosError)
    return data.user
  }

  public async createArticleWebhook(webhookUrl: string, webhookId: string): Promise<void> {
    const subscriptions: ZendeskEventType[] = ['zen:event-type:article.published', 'zen:event-type:article.unpublished']

    await this._client
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
      .catch(summarizeAxiosError)
  }

  public async deleteWebhook(webhookId: string): Promise<void> {
    await this._client.delete(`/api/v2/webhooks/${webhookId}`).catch(summarizeAxiosError)
  }

  public async findWebhooks(params?: Record<string, string>): Promise<ZendeskWebhook[]> {
    const { data } = await this._client.get('/api/v2/webhooks', { params }).catch(summarizeAxiosError)

    return data.webhooks
  }

  public async makeRequest(requestConfig: AxiosRequestConfig) {
    const { data, headers, status } = await this._client.request(requestConfig).catch(summarizeAxiosError)

    return {
      data,
      headers: headers as Record<string, string>,
      status,
    }
  }
}

export const getZendeskClient = (config: bp.configuration.Configuration): ZendeskApi =>
  new ZendeskApi(config.organizationSubdomain, config.email, config.apiToken)
