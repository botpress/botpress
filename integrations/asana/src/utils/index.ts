import { AsanaApi } from '../client'
import type { Config } from '../misc/types'

export const getClient = (config: Config) => new AsanaApi(config.apiToken)
