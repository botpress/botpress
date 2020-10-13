import { AxiosInstance } from 'axios'
import { NLU } from 'botpress/sdk'

import { LegacyIntentDefinition, NewLegacyIntentDefinition } from '../../backend/typings'

export type NLUApiClient = {
  fetchContexts: () => Promise<string[]>

  fetchIntents: () => Promise<LegacyIntentDefinition[]>
  fetchIntent: (x: string) => Promise<LegacyIntentDefinition>
  createIntent: (x: NewLegacyIntentDefinition) => Promise<any>
  updateIntent: (targetIntent: string, intent: LegacyIntentDefinition, updateTopics?: boolean) => Promise<any>
  deleteIntent: (x: string) => Promise<any>

  fetchEntities: () => Promise<NLU.EntityDefinition[]>
  fetchEntity: (x: string) => Promise<NLU.EntityDefinition>
  createEntity: (x: NLU.EntityDefinition) => Promise<any>
  updateEntity: (targetEntityId: string, x: NLU.EntityDefinition) => Promise<any>
  deleteEntity: (x: string) => Promise<any>
}

export const makeApiClient = (bp: { axios: AxiosInstance }): NLUApiClient => ({
  fetchContexts: () => bp.axios.get('/mod/nlu/contexts').then(res => res.data),

  fetchIntents: async () => bp.axios.get(`/mod/nlu/legacy-intents`).then(res => res.data),
  fetchIntent: (intentName: string) => bp.axios.get(`/mod/nlu/legacy-intents/${intentName}`).then(res => res.data),
  createIntent: (intent: NewLegacyIntentDefinition) => bp.axios.post('/mod/nlu/legacy-intents', intent),
  updateIntent: (targetIntent: string, intent: LegacyIntentDefinition) =>
    bp.axios.post(`/mod/nlu/legacy-intents/${targetIntent}`, intent),
  deleteIntent: (name: string) => bp.axios.post(`/mod/nlu/legacy-intents/${name}/delete`),

  // entity management occurs in the core
  fetchEntities: () => bp.axios.get('/nlu/entities').then(res => res.data),
  fetchEntity: (entityName: string) => bp.axios.get(`/nlu/entities/${entityName}`).then(res => res.data),
  createEntity: (entity: NLU.EntityDefinition) => bp.axios.post('/nlu/entities/', entity),
  updateEntity: (targetEntityId: string, entity: NLU.EntityDefinition) =>
    bp.axios.post(`/nlu/entities/${targetEntityId}`, entity),
  deleteEntity: (entityId: string) => bp.axios.post(`/nlu/entities/${entityId}/delete`)
})
