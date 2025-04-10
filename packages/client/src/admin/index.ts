import axios from 'axios'
import axiosRetry from 'axios-retry'
import * as common from '../common'
import * as gen from '../gen/admin'
import * as types from '../types'

type IClient = common.types.Simplify<gen.Client>
export type Operation = common.types.Operation<IClient>
export type ClientInputs = common.types.Inputs<IClient>
export type ClientOutputs = common.types.Outputs<IClient>

export type ClientProps = common.types.CommonClientProps & {
  workspaceId?: string
  token: string
}

export class Client extends gen.Client {
  public readonly config: Readonly<types.ClientConfig>

  public constructor(clientProps: ClientProps) {
    const clientConfig = common.config.getClientConfig(clientProps)
    const axiosConfig = common.axios.createAxios(clientConfig)
    const axiosInstance = axios.create(axiosConfig)
    super(axiosInstance, {
      toApiError: common.errors.toApiError,
    })

    if (clientProps.retry) {
      axiosRetry(axiosInstance, clientProps.retry)
    }

    this.config = clientConfig
  }

  public get list() {
    type ListInputs = common.types.ListInputs<IClient>
    return {
      publicIntegrations: (props: ListInputs['listPublicIntegrations']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listPublicIntegrations({ nextToken, ...props }).then((r) => ({ ...r, items: r.integrations }))
        ),
      bots: (props: ListInputs['listBots']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listBots({ nextToken, ...props }).then((r) => ({ ...r, items: r.bots }))
        ),
      botIssues: (props: ListInputs['listBotIssues']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listBotIssues({ nextToken, ...props }).then((r) => ({ ...r, items: r.issues }))
        ),
      workspaces: (props: ListInputs['listWorkspaces']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listWorkspaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.workspaces }))
        ),
      publicWorkspaces: (props: ListInputs['listPublicWorkspaces']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listPublicWorkspaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.workspaces }))
        ),
      workspaceMembers: (props: ListInputs['listWorkspaceMembers']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listWorkspaceMembers({ nextToken, ...props }).then((r) => ({ ...r, items: r.members }))
        ),
      integrations: (props: ListInputs['listIntegrations']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listIntegrations({ nextToken, ...props }).then((r) => ({ ...r, items: r.integrations }))
        ),
      interfaces: (props: ListInputs['listInterfaces']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listInterfaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.interfaces }))
        ),
      activities: (props: ListInputs['listActivities']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listActivities({ nextToken, ...props }).then((r) => ({ ...r, items: r.activities }))
        ),
      usageActivity: (props: ListInputs['listUsageActivity']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listUsageActivity({ nextToken, ...props }).then((r) => ({ ...r, items: r.data }))
        ),
      usageActivityDaily: (props: ListInputs['listUsageActivityDaily']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listUsageActivityDaily({ nextToken, ...props }).then((r) => ({ ...r, items: r.data }))
        ),
    }
  }
}
