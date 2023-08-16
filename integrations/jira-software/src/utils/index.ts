import { JiraApi } from '../client'
import type { Config } from '../misc/types'

export const getClient = (config: Config) =>
  new JiraApi(config.host, config.email, config.apiToken)
