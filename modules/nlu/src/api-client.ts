import axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'

export type NLUApi = ReturnType<typeof makeApiClient>
export const makeApiClient = (bp: { axios: AxiosInstance }) => ({
  fetchContexts: (): Promise<string[]> => bp.axios.get('/mod/nlu/contexts').then(res => res.data),
  fetchIntentsWithQNAs: (): Promise<sdk.NLU.IntentDefinition[]> =>
    bp.axios.get('/mod/nlu/intents').then(res => res.data),
  fetchIntents: async (): Promise<sdk.NLU.IntentDefinition[]> => {
    const { data } = await bp.axios.get('/mod/nlu/intents')
    return data.filter(x => !x.name.startsWith('__qna__'))
  },
  fetchIntent: (intentName: string): Promise<sdk.NLU.IntentDefinition> =>
    bp.axios.get(`/mod/nlu/intents/${intentName}`).then(res => res.data),
  createIntent: (intent: Partial<sdk.NLU.IntentDefinition>) => bp.axios.post('/mod/nlu/intents', intent),
  updateIntent: (targetIntent: string, intent: Partial<sdk.NLU.IntentDefinition>): Promise<void> =>
    bp.axios.post(`/mod/nlu/intents/${targetIntent}`, intent),
  deleteIntent: (name: string): Promise<void> => bp.axios.post(`/mod/nlu/intents/${name}/delete`),
  syncIntentTopics: (intentNames?: string[]): Promise<void> =>
    bp.axios.post('/mod/nlu/sync/intents/topics', { intentNames }),
  fetchEntities: (): Promise<sdk.NLU.EntityDefinition[]> => bp.axios.get('/mod/nlu/entities').then(res => res.data),
  fetchEntity: (entityName: string): Promise<sdk.NLU.EntityDefinition> =>
    bp.axios.get(`/mod/nlu/entities/${entityName}`).then(res => res.data),
  createEntity: (entity: sdk.NLU.EntityDefinition): Promise<void> => bp.axios.post('/mod/nlu/entities/', entity),
  updateEntity: (targetEntityId: string, entity: sdk.NLU.EntityDefinition): Promise<void> =>
    bp.axios.post(`/mod/nlu/entities/${targetEntityId}`, entity),
  deleteEntity: (entityId: string): Promise<void> => bp.axios.post(`/mod/nlu/entities/${entityId}/delete`)
})
