import { AxiosInstance } from 'axios'

import { HitlSessionOverview, Message } from '../../backend/typings'
import { Attribute, AutoComplete } from '../../config'

export interface HitlApi {
  findSessions: (searchText: string, pausedOnly: boolean) => Promise<HitlSessionOverview[]>
  fetchSessionMessages: (sessionId: string) => Promise<Message[]>
  getAttributes: () => Promise<Attribute[]>
  getautoComplete: () => Promise<AutoComplete>
  sendMessage: (sessionId: string, message: string) => Promise<any>
  setPauseState: (sessionId: string, action: string) => Promise<any>
}

export const makeApi = (bp: { axios: AxiosInstance }): HitlApi => ({
  findSessions: (searchText: string, pausedOnly: boolean) =>
    bp.axios.get(`/mod/hitl/sessions`, { params: { pausedOnly, searchText } }).then(res => res.data),
  fetchSessionMessages: sessionId => bp.axios.get(`/mod/hitl/sessions/${sessionId}`).then(res => res.data),
  getAttributes: () => bp.axios.get(`/mod/hitl/config/attributes`).then(res => res.data),
  getautoComplete: () => bp.axios.get(`/mod/hitl/config/autocomplete`).then(res => res.data),
  sendMessage: (sessionId, message) => bp.axios.post(`/mod/hitl/sessions/${sessionId}/message`, { message }),
  setPauseState: (sessionId, action) => bp.axios.post(`/mod/hitl/sessions/${sessionId}/${action}`)
})
