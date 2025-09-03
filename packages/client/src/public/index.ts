import axios from 'axios'
import axiosRetry from 'axios-retry'
import * as common from '../common'
import * as uploadFile from '../files/upload-file'
import * as gen from '../gen/public'
import * as types from '../types'

type IClient = common.types.Simplify<
  gen.Client & {
    uploadFile: (input: uploadFile.UploadFileInput) => Promise<uploadFile.UploadFileOutput>
  }
>
export type Operation = common.types.Operation<IClient>
export type ClientInputs = common.types.Inputs<IClient>
export type ClientOutputs = common.types.Outputs<IClient>

export type ClientProps = common.types.CommonClientProps & {
  integrationId?: string
  workspaceId?: string
  botId?: string
  token?: string
}

export class Client extends gen.Client implements IClient {
  public readonly config: Readonly<types.ClientConfig>

  public constructor(clientProps: ClientProps = {}) {
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
      publicInterfaces: (props: ListInputs['listPublicInterfaces']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listPublicInterfaces({ nextToken, ...props }).then((r) => ({ ...r, items: r.interfaces }))
        ),
      plugins: (props: ListInputs['listPlugins']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listPlugins({ nextToken, ...props }).then((r) => ({ ...r, items: r.plugins }))
        ),
      publicPlugins: (props: ListInputs['listPublicPlugins']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listPublicPlugins({ nextToken, ...props }).then((r) => ({ ...r, items: r.plugins }))
        ),
      activities: (props: ListInputs['listActivities']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listActivities({ nextToken, ...props }).then((r) => ({ ...r, items: r.activities }))
        ),
      files: (props: ListInputs['listFiles']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listFiles({ nextToken, ...props }).then((r) => ({ ...r, items: r.files }))
        ),
      filePassages: (props: ListInputs['listFilePassages']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listFilePassages({ nextToken, ...props }).then((r) => ({ ...r, items: r.passages }))
        ),
      fileTags: (props: ListInputs['listFileTags']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listFileTags({ nextToken, ...props }).then((r) => ({ ...r, items: r.tags }))
        ),
      fileTagValues: (props: ListInputs['listFileTagValues']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listFileTagValues({ nextToken, ...props }).then((r) => ({ ...r, items: r.values }))
        ),
      knowledgeBases: (props: ListInputs['listKnowledgeBases']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listKnowledgeBases({ nextToken, ...props }).then((r) => ({ ...r, items: r.knowledgeBases }))
        ),
      usageActivity: (props: ListInputs['listUsageActivity']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listUsageActivity({ nextToken, ...props }).then((r) => ({ ...r, items: r.data }))
        ),
      usageActivityDaily: (props: ListInputs['listUsageActivityDaily']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listUsageActivityDaily({ nextToken, ...props }).then((r) => ({ ...r, items: r.data }))
        ),
      workflows: (props: ListInputs['listWorkflows']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listWorkflows({ nextToken, ...props }).then((r) => ({ ...r, items: r.workflows }))
        ),
    }
  }

  /**
   * Create/update and upload a file in a single step. Returns an object containing the file metadata and the URL to retrieve the file.
   */
  public readonly uploadFile = async (input: uploadFile.UploadFileInput): Promise<uploadFile.UploadFileOutput> => {
    return await uploadFile.upload(this, input)
  }
}
