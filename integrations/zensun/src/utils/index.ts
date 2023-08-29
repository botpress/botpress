import { Config } from '../misc/types'
import { ZensunApi } from '../client'

export function getClient(config: Config) {
  return new ZensunApi(config.appId, config.keyId, config.keySecret)
}
