import { Conversation, RuntimeError, Message, User } from '@botpress/client'
import axiosGlobal, { Axios as AxiosInstance } from 'axios'
import {
  botIdHeader,
  operationHeader,
  integrationIdHeader,
  configurationHeader,
  botUserIdHeader,
  webhookIdHeader,
} from '../const'
import type { IntegrationContext, IntegrationOperation } from './context'
import { runtimeErrorSchema } from './error'
import type {
  ActionPayload,
  CreateConversationPayload,
  CreateUserPayload,
  MessagePayload,
  RegisterPayload,
  UnregisterPayload,
  WebhookPayload,
} from './implementation'

type Props<T = any> = {
  url: string
  data: T
} & Omit<IntegrationContext, 'operation'>

/**
 * @description Meant to query your integration server directly (e.g. without going through the Botpress API)
 */
export class IntegrationClient {
  private axios: AxiosInstance

  public constructor(axiosInstance?: AxiosInstance) {
    this.axios = axiosInstance ?? axiosGlobal.create({ timeout: 5000 })
  }

  public actionTriggered = (props: Props<ActionPayload<string, any>>) => request('action_triggered', props, this.axios)
  public messageCreated = (props: Props<MessagePayload<any, Message, Conversation, User>>) =>
    request('message_created', props, this.axios)
  public register = (props: Props<RegisterPayload>) => request('register', props, this.axios)
  public unregister = (props: Props<UnregisterPayload>) => request('unregister', props, this.axios)
  public webhookReceived = (props: Props<WebhookPayload>) => webhookRequest('webhook_received', props, this.axios)
  public createUser = (props: Props<CreateUserPayload>) =>
    request<{ user: { id: User['id'] } }>('create_user', props, this.axios)
  public createConversation = (props: Props<CreateConversationPayload>) =>
    request<{ conversation: { id: Conversation['id'] } }>('create_conversation', props, this.axios)
}

export function formatIntegrationHeaders(ctx: IntegrationContext) {
  return {
    [botIdHeader]: ctx.botId,
    [operationHeader]: ctx.operation,
    [botUserIdHeader]: ctx.botUserId,
    [integrationIdHeader]: ctx.integrationId,
    [webhookIdHeader]: ctx.webhookId,
    [configurationHeader]: Buffer.from(
      typeof ctx.configuration === 'string' ? ctx.configuration : JSON.stringify(ctx.configuration),
      'utf-8'
    ).toString('base64'),
  }
}

async function webhookRequest(operation: IntegrationOperation, { url, data, ...ctx }: Props, axios: AxiosInstance) {
  const response = await axios
    .post<unknown>(url, data, {
      headers: formatIntegrationHeaders({
        ...ctx,
        operation,
      }),
    })
    .catch((e) => {
      if (axiosGlobal.isAxiosError(e) && e.response?.status && e.response.status < 500) {
        return e.response
      }

      throw e
    })

  return response
}

async function request<O = any>(operation: IntegrationOperation, { url, data, ...ctx }: Props, axios: AxiosInstance) {
  try {
    const response = await axios.post<O>(url, data, {
      headers: formatIntegrationHeaders({
        ...ctx,
        operation,
      }),
    })

    return response
  } catch (e) {
    const runtimeErrorCode = new RuntimeError('').code
    if (axiosGlobal.isAxiosError(e) && e.response?.status === runtimeErrorCode) {
      const result = runtimeErrorSchema.safeParse(e.response.data)
      if (result.success) {
        throw new RuntimeError(result.data.message)
      }
    }
    throw e
  }
}
