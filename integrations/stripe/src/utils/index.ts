import { StripeApi } from '../client'
import { Config } from '../misc/types'

export function getClient(config: Config) {
  return new StripeApi(config.apiKey, config.apiVersion)
}
