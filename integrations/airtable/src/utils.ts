import { AirtableApi } from './client'
import { Configuration } from './misc/types'

export function getClient(config: Configuration) {
  return new AirtableApi(config.accessToken, config.baseId, config.endpointUrl)
}
