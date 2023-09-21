import { Config } from '../misc/types'
import { StripeApi } from '../client'

import { Client } from '.botpress'

export function getClient(config: Config) {
  return new StripeApi(config.apiKey, config.apiVersion)
}
