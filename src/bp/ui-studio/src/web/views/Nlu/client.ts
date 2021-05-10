import axios from 'axios'
import { NLU } from 'botpress/sdk'

export type NluClient = ReturnType<typeof makeNLUClient>

export const makeNLUClient = () => {
  const client = axios.create({ baseURL: `${window.BOT_API_PATH}/nlu` })
  return {
    fetchContexts: (): Promise<string[]> => client.get('/contexts').then(res => res.data),
    fetchIntentsWithQNAs: (): Promise<NLU.IntentDefinition[]> => client.get('/intents').then(res => res.data),
    fetchIntents: async (): Promise<NLU.IntentDefinition[]> => {
      const { data } = await client.get('/intents')
      return data.filter(x => !x.name.startsWith('__qna__'))
    },
    fetchIntent: (intentName: string): Promise<NLU.IntentDefinition> =>
      client.get(`/intents/${intentName}`).then(res => res.data),
    createIntent: (intent: Partial<NLU.IntentDefinition>) => client.post('/intents', intent),
    updateIntent: (targetIntent: string, intent: Partial<NLU.IntentDefinition>): Promise<void> =>
      client.post(`/intents/${targetIntent}`, intent),
    deleteIntent: (name: string): Promise<void> => client.post(`/intents/${name}/delete`),
    syncIntentTopics: (intentNames?: string[]): Promise<void> => client.post('/sync/intents/topics', { intentNames }),
    fetchEntities: (): Promise<NLU.EntityDefinition[]> => client.get('/entities').then(res => res.data),
    fetchEntity: (entityName: string): Promise<NLU.EntityDefinition> =>
      client.get(`/entities/${entityName}`).then(res => res.data),
    createEntity: (entity: NLU.EntityDefinition): Promise<void> => client.post('/entities/', entity),
    updateEntity: (targetEntityId: string, entity: NLU.EntityDefinition): Promise<void> =>
      client.post(`/entities/${targetEntityId}`, entity),
    deleteEntity: (entityId: string): Promise<void> => client.post(`/entities/${entityId}/delete`)
  }
}
