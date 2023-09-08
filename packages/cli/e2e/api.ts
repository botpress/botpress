import { Client } from '@botpress/client'

export type ApiBot = Awaited<ReturnType<Client['listBots']>>['bots'][0]
export const fetchAllBots = async (client: Client): Promise<ApiBot[]> => {
  let allBots: ApiBot[] = []
  let nextToken: string | undefined
  do {
    const { bots, meta } = await client.listBots({ nextToken })
    allBots = [...allBots, ...bots]
    nextToken = meta.nextToken
  } while (nextToken)
  return allBots
}

export type ApiIntegration = Awaited<ReturnType<Client['listIntegrations']>>['integrations'][0]
export const fetchAllIntegrations = async (client: Client): Promise<ApiIntegration[]> => {
  let allIntegrations: ApiIntegration[] = []
  let nextToken: string | undefined
  do {
    const { integrations, meta } = await client.listIntegrations({ nextToken })
    allIntegrations = [...allIntegrations, ...integrations]
    nextToken = meta.nextToken
  } while (nextToken)
  return allIntegrations
}
