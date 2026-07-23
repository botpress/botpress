import * as common from '../common'
import * as gen from '../gen/tables'
import * as types from '../types'

type IClient = common.types.Simplify<gen.Client>
export type Operation = common.types.Operation<IClient>
export type ClientInputs = common.types.Inputs<IClient>
export type ClientOutputs = common.types.Outputs<IClient>

export type ClientProps = common.types.CommonClientProps & {
  token: string
  botId: string
  integrationId?: string
  integrationAlias?: string
}

export class Client extends gen.Client {
  public readonly config: Readonly<types.ClientConfig>

  public constructor(clientProps: ClientProps) {
    const clientConfig = common.config.getClientConfig(clientProps)
    const httpClient = common.http.createHttpClient(clientConfig)

    super(httpClient, {
      toApiError: common.errors.toApiError,
    })

    if (clientProps.retry) {
      httpClient.retry = clientProps.retry
    }

    this.config = clientConfig
  }
}
