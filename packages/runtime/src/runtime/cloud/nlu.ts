import { Client } from '@botpress/nlu-client'
import { AxiosRequestConfig } from 'axios'
import { authenticateOAuth, CloudClientProps } from './oauth'

type Props = AxiosRequestConfig & CloudClientProps

export class CloudNluClient extends Client {
  constructor(props: Props) {
    super({ ...props, validateStatus: () => true })

    const { clientId, clientSecret } = props

    authenticateOAuth({ axiosInstance: this.axios, clientId, clientSecret, scopes: ['nlu'] })
  }
}
