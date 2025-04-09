import axios from 'axios'
import axiosRetry from 'axios-retry'
import * as common from '../common'
import * as gen from '../gen/runtime'
import * as types from '../types'

type IClient = common.types.Simplify<gen.Client>
export type Operation = common.types.Operation<IClient>
export type ClientInputs = common.types.Inputs<IClient>
export type ClientOutputs = common.types.Outputs<IClient>

export type ClientProps = common.types.CommonClientProps & {
  token: string
  botId: string
  integrationId?: string
}

export class Client extends gen.Client {
  public readonly config: Readonly<types.ClientConfig>

  public constructor(clientProps: ClientProps) {
    const clientConfig = common.config.getClientConfig(clientProps)
    const axiosConfig = common.axios.createAxios(clientConfig)
    const axiosInstance = axios.create(axiosConfig)
    super(axiosInstance)

    if (clientProps.retry) {
      axiosRetry(axiosInstance, clientProps.retry)
    }

    this.config = clientConfig
  }

  public get list() {
    type ListInputs = common.types.ListInputs<IClient>
    return {
      conversations: (props: ListInputs['listConversations']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listConversations({ nextToken, ...props }).then((r) => ({ ...r, items: r.conversations }))
        ),
      participants: (props: ListInputs['listParticipants']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listParticipants({ nextToken, ...props }).then((r) => ({ ...r, items: r.participants }))
        ),
      events: (props: ListInputs['listEvents']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listEvents({ nextToken, ...props }).then((r) => ({ ...r, items: r.events }))
        ),
      messages: (props: ListInputs['listMessages']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listMessages({ nextToken, ...props }).then((r) => ({ ...r, items: r.messages }))
        ),
      users: (props: ListInputs['listUsers']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listUsers({ nextToken, ...props }).then((r) => ({ ...r, items: r.users }))
        ),
      tasks: (props: ListInputs['listTasks']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listTasks({ nextToken, ...props }).then((r) => ({ ...r, items: r.tasks }))
        ),
    }
  }
}
