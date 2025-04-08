import * as common from '../common'
import * as gen from '../gen/public'
import * as types from './types'

type ListOperation = keyof {
  [K in types.Operation as types.ClientInputs[K] extends { nextToken?: string | undefined } ? K : never]: null
}
type ListInputs = {
  [K in ListOperation]: Omit<types.ClientInputs[K], 'nextToken'>
}

// lots of repeated code here, but I prefer using vertical selection than to make the code more complex - fleur
export class Lister {
  public constructor(private _client: gen.Client) {}
  public readonly conversations = (props: ListInputs['listConversations']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listConversations({ nextToken, ...props }).then((r) => ({ ...r, items: r.conversations }))
    )
  public readonly participants = (props: ListInputs['listParticipants']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listParticipants({ nextToken, ...props }).then((r) => ({ ...r, items: r.participants }))
    )
  public readonly events = (props: ListInputs['listEvents']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listEvents({ nextToken, ...props }).then((r) => ({ ...r, items: r.events }))
    )
  public readonly messages = (props: ListInputs['listMessages']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listMessages({ nextToken, ...props }).then((r) => ({ ...r, items: r.messages }))
    )
  public readonly users = (props: ListInputs['listUsers']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listUsers({ nextToken, ...props }).then((r) => ({ ...r, items: r.users }))
    )
  public readonly tasks = (props: ListInputs['listTasks']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listTasks({ nextToken, ...props }).then((r) => ({ ...r, items: r.tasks }))
    )
  public readonly publicIntegrations = (props: ListInputs['listPublicIntegrations']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listPublicIntegrations({ nextToken, ...props }).then((r) => ({ ...r, items: r.integrations }))
    )
  public readonly bots = (props: ListInputs['listBots']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listBots({ nextToken, ...props }).then((r) => ({ ...r, items: r.bots }))
    )
  public readonly botIssues = (props: ListInputs['listBotIssues']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listBotIssues({ nextToken, ...props }).then((r) => ({ ...r, items: r.issues }))
    )
  public readonly workspaces = (props: ListInputs['listWorkspaces']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listWorkspaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.workspaces }))
    )
  public readonly publicWorkspaces = (props: ListInputs['listPublicWorkspaces']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listPublicWorkspaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.workspaces }))
    )
  public readonly workspaceMembers = (props: ListInputs['listWorkspaceMembers']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listWorkspaceMembers({ nextToken, ...props }).then((r) => ({ ...r, items: r.members }))
    )
  public readonly integrations = (props: ListInputs['listIntegrations']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listIntegrations({ nextToken, ...props }).then((r) => ({ ...r, items: r.integrations }))
    )
  public readonly interfaces = (props: ListInputs['listInterfaces']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listInterfaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.interfaces }))
    )
  public readonly activities = (props: ListInputs['listActivities']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listActivities({ nextToken, ...props }).then((r) => ({ ...r, items: r.activities }))
    )
  public readonly files = (props: ListInputs['listFiles']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listFiles({ nextToken, ...props }).then((r) => ({ ...r, items: r.files }))
    )
  public readonly filePassages = (props: ListInputs['listFilePassages']) =>
    new common.listing.AsyncCollection(({ nextToken }) =>
      this._client.listFilePassages({ nextToken, ...props }).then((r) => ({ ...r, items: r.passages }))
    )
}
