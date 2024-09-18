import { AsanaApi } from '../client'
import type { Configuration } from '../misc/types'

export const getClient = (config: Configuration) => new AsanaApi(config.apiToken)
