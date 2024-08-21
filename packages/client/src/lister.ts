import * as gen from './gen'
import * as types from './types'

type ListOperation = keyof {
  [K in types.Operation as types.ClientInputs[K] extends { nextToken?: string | undefined } ? K : never]: null
}
type ListInputs = {
  [K in ListOperation]: Omit<types.ClientInputs[K], 'nextToken'>
}
type PageLister<R> = (t: { nextToken?: string }) => Promise<{ items: R[]; meta: { nextToken?: string } }>

class AsyncCollection<T> {
  public constructor(private _list: PageLister<T>) {}

  public async *[Symbol.asyncIterator]() {
    let nextToken: string | undefined
    do {
      const { items, meta } = await this._list({ nextToken })
      nextToken = meta.nextToken
      for (const item of items) {
        yield item
      }
    } while (nextToken)
  }

  public async collect(props: { limit?: number } = {}) {
    const limit = props.limit ?? Number.POSITIVE_INFINITY
    const arr: T[] = []
    let count = 0
    for await (const item of this) {
      arr.push(item)
      count++
      if (count >= limit) {
        break
      }
    }
    return arr
  }
}

// lots of repeated code here, but I prefer using vertical selection than to make the code more complex - fleur

export class Lister {
  public constructor(private client: gen.Client) {}
  public readonly conversations = (props: ListInputs['listConversations']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listConversations({ nextToken, ...props }).then((r) => ({ ...r, items: r.conversations }))
    )
  public readonly participants = (props: ListInputs['listParticipants']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listParticipants({ nextToken, ...props }).then((r) => ({ ...r, items: r.participants }))
    )
  public readonly events = (props: ListInputs['listEvents']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listEvents({ nextToken, ...props }).then((r) => ({ ...r, items: r.events }))
    )
  public readonly messages = (props: ListInputs['listMessages']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listMessages({ nextToken, ...props }).then((r) => ({ ...r, items: r.messages }))
    )
  public readonly users = (props: ListInputs['listUsers']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listUsers({ nextToken, ...props }).then((r) => ({ ...r, items: r.users }))
    )
  public readonly tasks = (props: ListInputs['listTasks']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listTasks({ nextToken, ...props }).then((r) => ({ ...r, items: r.tasks }))
    )
  public readonly publicIntegrations = (props: ListInputs['listPublicIntegrations']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listPublicIntegrations({ nextToken, ...props }).then((r) => ({ ...r, items: r.integrations }))
    )
  public readonly bots = (props: ListInputs['listBots']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listBots({ nextToken, ...props }).then((r) => ({ ...r, items: r.bots }))
    )
  public readonly botIssues = (props: ListInputs['listBotIssues']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listBotIssues({ nextToken, ...props }).then((r) => ({ ...r, items: r.issues }))
    )
  public readonly workspaces = (props: ListInputs['listWorkspaces']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listWorkspaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.workspaces }))
    )
  public readonly publicWorkspaces = (props: ListInputs['listPublicWorkspaces']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listPublicWorkspaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.workspaces }))
    )
  public readonly workspaceMembers = (props: ListInputs['listWorkspaceMembers']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listWorkspaceMembers({ nextToken, ...props }).then((r) => ({ ...r, items: r.members }))
    )
  public readonly integrations = (props: ListInputs['listIntegrations']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listIntegrations({ nextToken, ...props }).then((r) => ({ ...r, items: r.integrations }))
    )
  public readonly interfaces = (props: ListInputs['listInterfaces']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listInterfaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.interfaces }))
    )
  public readonly activities = (props: ListInputs['listActivities']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listActivities({ nextToken, ...props }).then((r) => ({ ...r, items: r.activities }))
    )
  public readonly files = (props: ListInputs['listFiles']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listFiles({ nextToken, ...props }).then((r) => ({ ...r, items: r.files }))
    )
  public readonly filePassages = (props: ListInputs['listFilePassages']) =>
    new AsyncCollection(({ nextToken }) =>
      this.client.listFilePassages({ nextToken, ...props }).then((r) => ({ ...r, items: r.passages }))
    )
}
