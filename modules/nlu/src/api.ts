import axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'

export type NLUApi = ReturnType<typeof makeApi>

export const makeApi = (bp: { axios: AxiosInstance }) => ({
  fetchContexts: (): Promise<string[]> => bp.axios.get('/nlu/contexts').then(res => res.data),
  fetchIntentsWithQNAs: (): Promise<sdk.NLU.IntentDefinition[]> => bp.axios.get('/nlu/intents').then(res => res.data),
  fetchIntents: async (): Promise<sdk.NLU.IntentDefinition[]> => {
    const { data } = await bp.axios.get('/nlu/intents')
    return data.filter(x => !x.name.startsWith('__qna__'))
  },
  fetchIntent: (intentName: string): Promise<sdk.NLU.IntentDefinition> =>
    bp.axios.get(`/nlu/intents/${intentName}`).then(res => res.data),
  createIntent: (intent: Partial<sdk.NLU.IntentDefinition>) => bp.axios.post('/nlu/intents', intent),
  updateIntent: (targetIntent: string, intent: Partial<sdk.NLU.IntentDefinition>): Promise<void> =>
    bp.axios.post(`/nlu/intents/${targetIntent}`, intent),
  deleteIntent: (name: string): Promise<void> => bp.axios.post(`/nlu/intents/${name}/delete`),
  syncIntentTopics: (intentNames?: string[]): Promise<void> =>
    bp.axios.post('/nlu/sync/intents/topics', { intentNames }),
  fetchEntities: (): Promise<sdk.NLU.EntityDefinition[]> => bp.axios.get('/nlu/entities').then(res => res.data),
  fetchEntity: (entityName: string): Promise<sdk.NLU.EntityDefinition> =>
    bp.axios.get(`/nlu/entities/${entityName}`).then(res => res.data),
  createEntity: (entity: sdk.NLU.EntityDefinition): Promise<void> => bp.axios.post('/nlu/entities/', entity),
  updateEntity: (targetEntityId: string, entity: sdk.NLU.EntityDefinition): Promise<void> =>
    bp.axios.post(`/nlu/entities/${targetEntityId}`, entity),
  deleteEntity: (entityId: string): Promise<void> => bp.axios.post(`/nlu/entities/${entityId}/delete`)
})

export const createApi = async (bp: typeof sdk, botId: string) => {
  const axiosForBot = axios.create(await bp.http.getAxiosConfigForBot(botId, { localUrl: true }))
  const api = makeApi({ axios: axiosForBot })
  return api
}
