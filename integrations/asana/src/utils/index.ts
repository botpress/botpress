import type { Config } from '../misc/types'

import { AsanaApi } from '../client'

export const getClient = (config: Config) => new AsanaApi(config.apiToken)
