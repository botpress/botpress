import { Client } from '@botpress/client'

export type ApiBot = Awaited<ReturnType<Client['listBots']>>['bots'][0]
export const fetchAllBots = async (client: Client): Promise<ApiBot[]> =>
  await _fetchAllPages<ApiBot>((params) => client.listBots(params).then((res) => ({ ...res, items: res.bots })))

export type ApiIntegration = Awaited<ReturnType<Client['listIntegrations']>>['integrations'][0]
export const fetchAllIntegrations = async (client: Client): Promise<ApiIntegration[]> =>
  await _fetchAllPages<ApiIntegration>((params) =>
    client.listIntegrations(params).then((res) => ({ ...res, items: res.integrations }))
  )

export type ApiInterface = Awaited<ReturnType<Client['listInterfaces']>>['interfaces'][0]
export const fetchAllInterfaces = async (client: Client): Promise<ApiInterface[]> =>
  await _fetchAllPages<ApiInterface>((params) =>
    client.listInterfaces(params).then((res) => ({ ...res, items: res.interfaces }))
  )

export type ApiPlugin = Awaited<ReturnType<Client['listPlugins']>>['plugins'][0]
export const fetchAllPlugins = async (client: Client): Promise<ApiPlugin[]> =>
  await _fetchAllPages<ApiPlugin>((params) =>
    client.listPlugins(params).then((res) => ({ ...res, items: res.plugins }))
  )

const _fetchAllPages = async <T>(
  fetchFn: (params: { nextToken?: string }) => Promise<{ items: T[]; meta: { nextToken?: string } }>
): Promise<T[]> => {
  let allItems: T[] = []
  let nextToken: string | undefined
  do {
    const { items, meta } = await fetchFn({ nextToken })
    allItems = [...allItems, ...items]
    nextToken = meta.nextToken
  } while (nextToken)
  return allItems
}
