import { Client } from '@botpress/client'

export type ApiBot = Awaited<ReturnType<Client['listBots']>>['bots'][0]
export const fetchAllBots = async (client: Client): Promise<ApiBot[]> => await client.list.bots({}).collect()

export type ApiIntegration = Awaited<ReturnType<Client['listIntegrations']>>['integrations'][0]
export const fetchAllIntegrations = async (client: Client): Promise<ApiIntegration[]> =>
  await client.list.integrations({}).collect()

export type ApiInterface = Awaited<ReturnType<Client['listInterfaces']>>['interfaces'][0]

export type ApiPlugin = Awaited<ReturnType<Client['listPlugins']>>['plugins'][0]
