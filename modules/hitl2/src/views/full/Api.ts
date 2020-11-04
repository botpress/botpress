import { AxiosInstance } from 'axios'
import _ from 'lodash'
import moment from 'moment'

import { AgentType, CommentType, EscalationType } from '../../types'

// TODO Handle casting when object is undefined
export function castDate<T extends object>(object: T, paths: string[]): T {
  paths.map(path => {
    _.get(object, path, false) && _.set(object, path, moment(_.get(object, path)).toDate())
  })
  return object
}

export function castEscalation(item: EscalationType) {
  return _.chain(item)
    .thru(value =>
      castDate(value, ['createdAt', 'updatedAt', 'assignedAt', 'resolvedAt', 'userConversation.createdOn'])
    )
    .thru(value => {
      if (_.isEmpty(value.userConversation)) {
        return value
      }

      value.userConversation = {
        ...value.userConversation,
        event: JSON.parse(<string>value.userConversation.event)
      }
      return value
    })
    .thru(value => {
      if (_.isEmpty(value.comments)) {
        return value
      }

      value.comments = _.castArray(value.comments).map(comment => castComment(comment))
      return value
    })
    .value()
}

export function castComment(item: CommentType) {
  return castDate(item, ['createdAt', 'updatedAt'])
}

export function castMessage(item: EventType) {
  return _.chain(item)
    .thru(value => castDate(value, ['createdOn']))
    .thru(value => {
      value.event = JSON.parse(value.event as string)
      return value
    })
    .value()
}

export interface ApiType {
  setOnline: () => Promise<Partial<AgentType>>
  setOffline: () => Promise<Partial<AgentType>>
  getAgents: (online?: boolean) => Promise<AgentType[]>
  getCurrentAgent: () => Promise<AgentType>
  getComments: (id: string) => Promise<CommentType[]>
  createComment: (id: string, payload: Partial<CommentType>) => Promise<CommentType>
  getEscalations: (column?: string, desc?: boolean, limit?: number) => Promise<EscalationType[]>
  assignEscalation: (id: string) => Promise<EscalationType>
  resolveEscalation: (id: string) => Promise<EscalationType>
  getMessages: (id: string, limit?: number) => Promise<EventType[]>
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
    getEscalations: async (column?, desc?, limit?) =>
      bp.axios
        .get(`${base}/escalations`, {
          params: {
            desc: desc,
            column: column,
            limit: limit
          }
        })
        .then(res => res.data)
        .then(data => data.map(castEscalation)),
    assignEscalation: async id =>
      bp.axios
        .post(`${base}/escalations/${id}/assign`)
        .then(res => res.data)
        .then(data => castEscalation(data)),
    resolveEscalation: async id =>
      bp.axios
        .post(`${base}/escalations/${id}/resolve`)
        .then(res => res.data)
        .then(data => castEscalation(data)),
    getMessages: async (id, limit?) =>
      bp.axios
        .get(`${base}/conversations/${id}/messages`, { params: { limit: limit } })
        .then(res => res.data)
        .then(data => data.map(castMessage))
  }
}
