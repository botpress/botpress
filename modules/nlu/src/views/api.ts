import { AxiosInstance } from 'axios'
import { NLU } from 'botpress/sdk'

export interface NLUApi {
  fetchContexts: () => Promise<string[]>
  fetchIntents: () => Promise<NLU.IntentDefinition[]>
  fetchIntent: (x: string) => Promise<NLU.IntentDefinition>
  createIntent: (x: Partial<NLU.IntentDefinition>) => Promise<any>
  updateIntent: (targetIntent: string, intent: Partial<NLU.IntentDefinition>, updateTopics?: boolean) => Promise<any>
  refreshIntentTopics: (intentNames: string[]) => Promise<void>
  deleteIntent: (x: string) => Promise<any>
  fetchEntities: () => Promise<NLU.EntityDefinition[]>
  fetchEntity: (x: string) => Promise<NLU.EntityDefinition>
  createEntity: (x: NLU.EntityDefinition) => Promise<any>
  updateEntity: (targetEntityId: string, x: NLU.EntityDefinition) => Promise<any>
  deleteEntity: (x: string) => Promise<any>
}

export const makeApi = (bp: { axios: AxiosInstance }): NLUApi => ({
  fetchContexts: () => bp.axios.get(`/mod/nlu/contexts`).then(res => res.data),
  fetchIntents: async () => {
    const { data } = await bp.axios.get('/mod/nlu/intents')
    return data.filter(x => !x.name.startsWith('__qna__'))
  },
  fetchIntent: (intentName: string) => bp.axios.get(`/mod/nlu/intents/${intentName}`).then(res => res.data),
  createIntent: (intent: Partial<NLU.IntentDefinition>) => bp.axios.post(`/mod/nlu/intents`, intent),
  updateIntent: (targetIntent: string, intent: Partial<NLU.IntentDefinition>) =>
    bp.axios.post(`/mod/nlu/intents/${targetIntent}`, intent),
  deleteIntent: (name: string) => bp.axios.post(`/mod/nlu/intents/${name}/delete`),
  refreshIntentTopics: (intentNames: string[]) => bp.axios.post(`/mod/nlu/refreshIntentsTopics`, { intentNames }),
  fetchEntities: () => bp.axios.get('/mod/nlu/entities').then(res => res.data),
  fetchEntity: (entityName: string) => bp.axios.get(`/mod/nlu/entities/${entityName}`).then(res => res.data),
  createEntity: (entity: NLU.EntityDefinition) => bp.axios.post(`/mod/nlu/entities/`, entity),
  updateEntity: (targetEntityId: string, entity: NLU.EntityDefinition) =>
    bp.axios.post(`/mod/nlu/entities/${targetEntityId}`, entity),
  deleteEntity: (entityId: string) => bp.axios.post(`/mod/nlu/entities/${entityId}/delete`)
})
