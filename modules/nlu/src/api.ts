import axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'

export type NLUApi = ReturnType<typeof makeApi>

export const makeApi = (bp: { axios: AxiosInstance }) => ({
  fetchIntentsWithQNAs: (): Promise<sdk.NLU.IntentDefinition[]> => bp.axios.get('/nlu/intents').then(res => res.data),
  fetchEntities: (): Promise<sdk.NLU.EntityDefinition[]> => bp.axios.get('/nlu/entities').then(res => res.data)
})

export const createApi = async (bp: typeof sdk, botId: string) => {
  const axiosForBot = axios.create(await bp.http.getAxiosConfigForBot(botId, { localUrl: true }))
  const api = makeApi({ axios: axiosForBot })
  return api
}
