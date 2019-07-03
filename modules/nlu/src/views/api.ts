import { AxiosInstance } from 'axios'

interface BP {
  axios: AxiosInstance
}

// TODO better typings
export const makeApi = (bp: BP) => ({
  fetchContexts: () => bp.axios.get(`/mod/nlu/contexts`).then(res => res.data),
  fetchIntents: async () => {
    const { data } = await bp.axios.get('/mod/nlu/intents')
    return data.filter(x => !x.name.startsWith('__qna__'))
  },
  createIntent: (name: string) => bp.axios.post(`/mod/nlu/intents`, { name }), // TODO accept intentdef instead
  updateIntent: () => {}, // TODO use /intent/:id/utterances and use it in intent editor
  deleteIntent: (name: string) => bp.axios.delete(`/mod/nlu/intents/${name}`),
  fetchEntities: () => bp.axios.get('/mod/nlu/entities').then(res => res.data.filter(r => r.type !== 'system')),
  createEntity: (entity: any) => bp.axios.post(`/mod/nlu/entities/`, entity),
  updateEntity: (entity: any) => bp.axios.put(`/mod/nlu/entities/${entity.id}`, entity),
  deleteEntity: (entityId: string) => bp.axios.delete(`/mod/nlu/entities/${entityId}`)
})
