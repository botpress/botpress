import { AxiosInstance } from 'axios'
import { NLU } from 'botpress/sdk'

export interface NLUAPI {
  fetchContexts: () => Promise<string[]>
  fetchIntents: () => Promise<NLU.IntentDefinition[]>
  createIntent: (x: Partial<NLU.IntentDefinition>) => Promise<any>
  updateIntent: Function
  deleteIntent: (x: string) => Promise<any>
  fetchEntities: () => Promise<NLU.EntityDefinition[]>
  createEntity: (x: NLU.EntityDefinition) => Promise<any>
  updateEntity: (x: NLU.EntityDefinition) => Promise<any>
  deleteEntity: (x: string) => Promise<any>
}

export const makeApi = (bp: { axios: AxiosInstance }): NLUAPI => ({
  fetchContexts: () => bp.axios.get(`/mod/nlu/contexts`).then(res => res.data),
  fetchIntents: async () => {
    const { data } = await bp.axios.get('/mod/nlu/intents')
    return data.filter(x => !x.name.startsWith('__qna__'))
  },
  createIntent: (intent: Partial<NLU.IntentDefinition>) => bp.axios.post(`/mod/nlu/intents`, intent),
  updateIntent: () => {}, // TODO use /intent/:id/utterances and use it in intent editor
  deleteIntent: (name: string) => bp.axios.delete(`/mod/nlu/intents/${name}`),
  fetchEntities: () => bp.axios.get('/mod/nlu/entities').then(res => res.data.filter(r => r.type !== 'system')),
  createEntity: (entity: NLU.EntityDefinition) => bp.axios.post(`/mod/nlu/entities/`, entity),
  updateEntity: (entity: NLU.EntityDefinition) => bp.axios.put(`/mod/nlu/entities/${entity.id}`, entity),
  deleteEntity: (entityId: string) => bp.axios.delete(`/mod/nlu/entities/${entityId}`)
})
