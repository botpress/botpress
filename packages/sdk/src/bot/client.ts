import axiosGlobal, { Axios as AxiosInstance } from 'axios'
import type { Merge, Except } from 'type-fest'
import { botIdHeader, operationHeader, configurationHeader, typeHeader } from '../const'
import type { BotContext, BotOperation } from './context'
import type { RegisterBotPayload, UnregisterBotPayload, EventReceivedBotPayload } from './implementation'

type Props<T = any> = Merge<
  Except<BotContext, 'operation'>,
  {
    url: string
    data: T
  }
>

/**
 * @description Meant to query your bot server directly (e.g. without going through the Botpress API)
 */
export class BotClient {
  private axios: AxiosInstance

  public constructor(axiosInstance?: AxiosInstance) {
    this.axios = axiosInstance ?? axiosGlobal.create({ timeout: 5000 })
  }

  public register = (props: Props<RegisterBotPayload>) => request('register', props, this.axios)
  public unregister = (props: Props<UnregisterBotPayload>) => request('unregister', props, this.axios)
  public eventReceived = (props: Props<EventReceivedBotPayload>) => request('event_received', props, this.axios)
}

export function formatBotHeaders(ctx: BotContext) {
  return {
    [typeHeader]: ctx.type,
    [botIdHeader]: ctx.botId,
    [operationHeader]: ctx.operation,
    [configurationHeader]: Buffer.from(
      typeof ctx.configuration === 'string' ? ctx.configuration : JSON.stringify(ctx.configuration),
      'utf-8'
    ).toString('base64'),
  }
}

async function request<O = any>(operation: BotOperation, { url, data, ...ctx }: Props, axios: AxiosInstance) {
  const response = await axios.post<O>(url, data, {
    headers: formatBotHeaders({
      ...ctx,
      operation,
    }),
  })

  return response.data
}
