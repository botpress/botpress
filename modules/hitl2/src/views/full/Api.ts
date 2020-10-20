import { AxiosInstance } from 'axios'
import _ from 'lodash'
import moment from 'moment'

import { AgentType, CommentType, EscalationType } from '../../types'

// TODO Handle casting when object is undefined
export function castDate(object: any, paths: string[]) {
  paths.map(path => {
    _.get(object, path, false) && _.set(object, path, moment(_.get(object, path)).toDate())
  })
  return object
}

export function castEscalation(item) {
  return _.thru(
    castDate(item, ['createdAt', 'updatedAt', 'assignedAt', 'resolvedAt', 'userConversation.createdOn']),
    casted => {
      casted.comments = _.castArray(casted.comments).map(comment => castComment(comment))
      return casted
    }
  )
}

export function castComment(item) {
  return castDate(item, ['createdAt', 'updatedAt'])
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
  // TODO might be a finer way to do this
  const base = '/mod/hitl2'

  return {
    setOnline: async () => bp.axios.post(`${base}/agents/me/online`).then(res => res.data),
    setOffline: async () => bp.axios.post(`${base}/agents/me/offline`).then(res => res.data),
    getAgents: async (online?: boolean) =>
      bp.axios.get(`${base}/agents`, { params: { online: online } }).then(res => res.data),
    getCurrentAgent: async () => bp.axios.get(`${base}/agents/me`).then(res => res.data),
    getComments: async id =>
      bp.axios
        .get(`${base}/escalations/${id}/comments`)
        .then(res => res.data)
        .then(data => data.map(item => castComment(item))),
    createComment: async (id, payload) =>
      bp.axios
        .post(`${base}/escalations/${id}/comments`, payload)
        .then(res => res.data)
        .then(data => castComment(data)),
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
        .then(data => data.map(castEscalation)),
    assignEscalation: async id =>
      bp.axios
        .post(`${base}/escalations/${id}/assign`)
        .then(res => res.data)
        .then(data => data.map(castEscalation)),
    resolveEscalation: async id =>
      bp.axios
        .post(`${base}/escalations/${id}/resolve`)
        .then(res => res.data)
        .then(data => data.map(castEscalation))
  }
}
