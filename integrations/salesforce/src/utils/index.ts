import { Config } from '../misc/types'
import { SalesforceApi } from '../client'

export function getClient(config: Config) {
  return new SalesforceApi(
    config.email,
    config.password,
    config.securityToken,
    config.SFLoginURL,
    config.apiVersion
  )
}
