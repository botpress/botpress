import type { Config } from '../misc/types'

import { JiraApi } from '../client'

export const getClient = (config: Config) =>
  new JiraApi(config.host, config.email, config.apiToken)
