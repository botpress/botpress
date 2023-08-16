import { TrelloApi } from '../client'
import { Config } from '../misc/types'

export function getClient(config: Config) {
  return new TrelloApi(config.apiKey, config.token)
}
