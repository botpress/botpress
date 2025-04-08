import axios from 'axios'
import axiosRetry from 'axios-retry'
import * as common from '../common'
import * as gen from '../gen/files'
import * as uploadFile from './upload-file'

export * from './errors'

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
  public readonly config: Readonly<common.types.ClientConfig>

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

  public async uploadFile(input: uploadFile.UploadFileInput): Promise<uploadFile.UploadFileOutput> {
    return await uploadFile.upload(this, input)
  }

  // TODO: add listing utilities
}
