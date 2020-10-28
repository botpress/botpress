import axios, { AxiosInstance } from 'axios'
import { NLU } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'

export interface NLUApi {
  fetchContexts: () => Promise<string[]>
  fetchIntentsWithQNAs: () => Promise<NLU.IntentDefinition[]>
  fetchIntents: () => Promise<NLU.IntentDefinition[]>
  fetchIntent: (x: string) => Promise<NLU.IntentDefinition>
  createIntent: (x: Partial<NLU.IntentDefinition>) => Promise<any>
  updateIntent: (targetIntent: string, intent: Partial<NLU.IntentDefinition>, updateTopics?: boolean) => Promise<any>
  syncIntentTopics: (intentNames?: string[]) => Promise<void>
  deleteIntent: (x: string) => Promise<any>
  fetchEntities: () => Promise<NLU.EntityDefinition[]>
  fetchEntity: (x: string) => Promise<NLU.EntityDefinition>
  createEntity: (x: NLU.EntityDefinition) => Promise<any>
  updateEntity: (targetEntityId: string, x: NLU.EntityDefinition) => Promise<any>
  deleteEntity: (x: string) => Promise<any>
  train: () => Promise<void>
  cancelTraining: () => Promise<void>
}

export const makeApi = (bp: { axios: AxiosInstance }): NLUApi => ({
  fetchContexts: () => bp.axios.get('/nlu/contexts').then(res => res.data),
  fetchIntentsWithQNAs: () => bp.axios.get('/nlu/intents').then(res => res.data),
  fetchIntents: async () => {
    const { data } = await bp.axios.get('/nlu/intents')
    return data.filter(x => !x.name.startsWith('__qna__'))
  },
  fetchIntent: (intentName: string) => bp.axios.get(`/nlu/intents/${intentName}`).then(res => res.data),
  createIntent: (intent: Partial<NLU.IntentDefinition>) => bp.axios.post('/nlu/intents', intent),
  updateIntent: (targetIntent: string, intent: Partial<NLU.IntentDefinition>) =>
    bp.axios.post(`/nlu/intents/${targetIntent}`, intent),
  deleteIntent: (name: string) => bp.axios.post(`/nlu/intents/${name}/delete`),
  syncIntentTopics: (intentNames?: string[]) => bp.axios.post('/nlu/sync/intents/topics', { intentNames }),
  fetchEntities: () => bp.axios.get('/nlu/entities').then(res => res.data),
  fetchEntity: (entityName: string) => bp.axios.get(`/nlu/entities/${entityName}`).then(res => res.data),
  createEntity: (entity: NLU.EntityDefinition) => bp.axios.post('/nlu/entities/', entity),
  updateEntity: (targetEntityId: string, entity: NLU.EntityDefinition) =>
    bp.axios.post(`/nlu/entities/${targetEntityId}`, entity),
  deleteEntity: (entityId: string) => bp.axios.post(`/nlu/entities/${entityId}/delete`),
  train: () => bp.axios.post('/mod/nlu/train'),
  cancelTraining: () => bp.axios.post('/mod/nlu/train/delete')
})

export const createApi = async (bp: typeof sdk, botId: string) => {
  const axiosForBot = axios.create(await bp.http.getAxiosConfigForBot(botId, { localUrl: true }))
  const api = makeApi({ axios: axiosForBot })
  return api
}
