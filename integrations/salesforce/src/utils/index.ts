import { Config } from '../misc/types'
import { SalesforceApi } from '../client'

export async function getClient(config: Config) {
  const SalesforceClient = new SalesforceApi(
    config.email,
    config.password,
    config.securityToken,
    config.SFLoginURL,
    config.apiVersion
  )
  await SalesforceClient.login()
  return SalesforceClient
}
