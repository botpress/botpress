import axios from 'axios'
import axiosRetry from 'axios-retry'
import * as common from '../common'
import * as gen from '../gen/files'
import * as types from '../types'
import * as uploadFile from './upload-file'

type IClient = common.types.Simplify<
  gen.Client & {
    uploadFile: (input: uploadFile.UploadFileInput) => Promise<uploadFile.UploadFileOutput>
  }
>

export type Operation = common.types.Operation<IClient>
export type ClientInputs = common.types.Inputs<IClient>
export type ClientOutputs = common.types.Outputs<IClient>

export type ClientProps = common.types.CommonClientProps & {
  token: string
  botId: string
  integrationId?: string
}

export class Client extends gen.Client implements IClient {
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

    const _makeLister = <P, R extends { meta: { nextToken?: string } }, I>(
      label: string,
      fn: (req: P & { nextToken?: string }) => Promise<R>,
      items: (res: R) => I[]
    ) => {
      return (props: P) =>
        new common.listing.AsyncCollection(async ({ nextToken }) => {
          const start = Date.now()
          const request = { nextToken, ...props }

          const response = await fn(request)

          if (this.config.debug) {
            const duration = Date.now() - start
            console.debug(`${label} request:`, request, `\n${label} response:`, response, `\n(${duration}ms)`)
          }
          return { ...response, items: items(response) }
        })
    }

    return {
      files: _makeLister<
        ListInputs['listFiles'],
        gen.listFiles.ListFilesResponse,
        gen.listFiles.ListFilesResponse['files'][number]
      >('listFiles', this.listFiles, (r) => r.files),
      filePassages: _makeLister<
        ListInputs['listFilePassages'],
        gen.listFilePassages.ListFilePassagesResponse,
        gen.listFilePassages.ListFilePassagesResponse['passages'][number]
      >('listFilePassages', this.listFilePassages, (r) => r.passages),
      fileTags: _makeLister<
        ListInputs['listFileTags'],
        gen.listFileTags.ListFileTagsResponse,
        gen.listFileTags.ListFileTagsResponse['tags'][number]
      >('listFileTags', this.listFileTags, (r) => r.tags),
      fileTagValues: _makeLister<
        ListInputs['listFileTagValues'],
        gen.listFileTagValues.ListFileTagValuesResponse,
        gen.listFileTagValues.ListFileTagValuesResponse['values'][number]
      >('listFileTagValues', this.listFileTagValues, (r) => r.values),
      knowledgeBases: _makeLister<
        ListInputs['listKnowledgeBases'],
        gen.listKnowledgeBases.ListKnowledgeBasesResponse,
        gen.listKnowledgeBases.ListKnowledgeBasesResponse['knowledgeBases'][number]
      >('knowledgeBases', this.listKnowledgeBases, (r) => r.knowledgeBases),
    }
  }

  /**
   * Create/update and upload a file in a single step. Returns an object containing the file metadata and the URL to retrieve the file.
   */
  public async uploadFile(input: uploadFile.UploadFileInput): Promise<uploadFile.UploadFileOutput> {
    return await uploadFile.upload(this, input)
  }
}
