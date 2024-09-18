import { TrelloApi } from '../client'
import { Configuration } from '../misc/types'

export function getClient(config: Configuration) {
  return new TrelloApi(config.apiKey, config.token)
}
