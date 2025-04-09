import axios from 'axios'
import axiosRetry from 'axios-retry'
import * as common from '../common'
import * as uploadFile from '../files/upload-file'
import * as gen from '../gen/public'
import * as types from '../types'
import * as lister from './lister'

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
    super(axiosInstance)

    if (clientProps.retry) {
      axiosRetry(axiosInstance, clientProps.retry)
    }

    this.config = clientConfig
  }

  public get list() {
    return new lister.Lister(this)
  }

  /**
   * Create/update and upload a file in a single step. Returns an object containing the file metadata and the URL to retrieve the file.
   */
  public readonly uploadFile = async (input: uploadFile.UploadFileInput): Promise<uploadFile.UploadFileOutput> => {
    return await uploadFile.upload(this, input)
  }
}
