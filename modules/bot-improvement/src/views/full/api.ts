import { AxiosInstance } from 'axios'

import { HitlSessionOverview, Message } from '../../backend/typings'
import { Attribute } from '../../config'

export interface BotImprovementApi {
  getSessions: () => Promise<HitlSessionOverview[]>
  fetchSessionMessages: (sessionId: string) => Promise<Message[]>
  getAttributes: () => Promise<Attribute[]>
  sendMessage: (sessionId: string, message: string) => Promise<any>
  setPauseState: (sessionId: string, action: string) => Promise<any>
}

export const makeApi = (bp: { axios: AxiosInstance }): BotImprovementApi => ({
  getSessions: () => bp.axios.get(`/mod/hitl/sessions`).then(res => res.data),
  fetchSessionMessages: sessionId => bp.axios.get(`/mod/hitl/sessions/${sessionId}`).then(res => res.data),
  getAttributes: () => bp.axios.get(`/mod/hitl/config/attributes`).then(res => res.data),
  sendMessage: (sessionId, message) => bp.axios.post(`/mod/hitl/sessions/${sessionId}/message`, { message }),
  setPauseState: (sessionId, action) => bp.axios.post(`/mod/hitl/sessions/${sessionId}/${action}`)
})
