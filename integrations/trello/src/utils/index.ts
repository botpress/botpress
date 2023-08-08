import { Config } from '../misc/types'
import { TrelloApi } from '../client'

export function getClient(config: Config) {
  return new TrelloApi(config.apiKey, config.token)
}
