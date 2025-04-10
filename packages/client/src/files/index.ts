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
    return {
      files: (props: ListInputs['listFiles']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listFiles({ nextToken, ...props }).then((r) => ({ ...r, items: r.files }))
        ),
      filePassages: (props: ListInputs['listFilePassages']) =>
        new common.listing.AsyncCollection(({ nextToken }) =>
          this.listFilePassages({ nextToken, ...props }).then((r) => ({ ...r, items: r.passages }))
        ),
    }
  }

  /**
   * Create/update and upload a file in a single step. Returns an object containing the file metadata and the URL to retrieve the file.
   */
  public async uploadFile(input: uploadFile.UploadFileInput): Promise<uploadFile.UploadFileOutput> {
    return await uploadFile.upload(this, input)
  }
}
