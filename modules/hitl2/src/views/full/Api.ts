import _ from 'lodash'
import { AxiosInstance } from 'axios'
import moment from 'moment'
import { AgentType, CommentType, EscalationType, UserType } from '../../types'

function castDate(object, paths) {
  paths.map(path => {
    _.has(object, path) && _.set(object, path, moment(_.get(object, path)).toDate())
  })
  return object
}

export interface ApiType {
  setOnline: () => Promise<Partial<AgentType>>
  setOffline: () => Promise<Partial<AgentType>>
  getAgents: (online?: boolean) => Promise<AgentType[]>
  getCurrentAgent: () => Promise<AgentType>
  getComments: (id: string) => Promise<CommentType[]>
  createComment: (id: string, payload: Partial<CommentType>) => Promise<CommentType>
  getEscalations: (orderByColumn?: string, orderByDirection?: string, limit?: number) => Promise<EscalationType[]>
  assignEscalation: (id: string) => Promise<EscalationType>
  resolveEscalation: (id: string) => Promise<EscalationType>
}

export const Api = (bp: { axios: AxiosInstance }): ApiType => {
  const base = '/mod/hitl2'

  return {
    setOnline: async () => bp.axios.post(`${base}/agents/me/online`).then(res => res.data),
    setOffline: async () => bp.axios.delete(`${base}/agents/me/online`).then(res => res.data),
    getAgents: async (online?: boolean) =>
      bp.axios.get(`${base}/agents`, { params: { online: online } }).then(res => res.data),
    getCurrentAgent: async () => bp.axios.get(`${base}/agents/me`).then(res => res.data),
    getComments: async id =>
      bp.axios
        .get(`${base}/escalations/${id}/comments`)
        .then(res => res.data)
        .then(data => data.map(item => castDate(item, ['createdAt', 'updatedAt']))),
    createComment: async (id, payload) =>
      bp.axios
        .post(`${base}/escalations/${id}/comments`, payload)
        .then(res => res.data)
        .then(data => castDate(data, ['createdAt', 'updatedAt'])),
    getEscalations: async (orderByColumn?: string, orderByDirection?: string, limit?: number) =>
      bp.axios
        .get(`${base}/escalations`, {
          params: {
            orderByDirection: orderByDirection,
            orderByColumn: orderByColumn,
            limit: limit
          }
        })
        .then(res => res.data)
        .then(data =>
          data.map(item =>
            castDate(item, ['createdAt', 'updatedAt', 'assignedAt', 'resolvedAt', 'userConversation.createdOn'])
          )
        ),
    assignEscalation: async id =>
      bp.axios
        .post(`${base}/escalations/${id}/assign`)
        .then(res => res.data)
        .then(data =>
          data.map(item =>
            castDate(item, ['createdAt', 'updatedAt', 'assignedAt', 'resolvedAt', 'userConversation.createdOn'])
          )
        ),
    resolveEscalation: async id =>
      bp.axios
        .post(`${base}/escalations/${id}/resolve`)
        .then(res => res.data)
        .then(data =>
          data.map(item =>
            castDate(item, ['createdAt', 'updatedAt', 'assignedAt', 'resolvedAt', 'userConversation.createdOn'])
          )
        )
  }
}
