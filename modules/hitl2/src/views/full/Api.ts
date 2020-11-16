import { AxiosInstance } from 'axios'
import _ from 'lodash'
import moment from 'moment'

import { Config } from '../../config'
import { IAgent, IComment, IEscalation, IEvent } from '../../types'

// TODO Handle casting when object is undefined
export function castDate<T extends object>(object: T, paths: string[]): T {
  paths.map(path => {
    _.get(object, path, false) && _.set(object, path, moment(_.get(object, path)).toDate())
  })
  return object
}

export function castEscalation(item: IEscalation) {
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
        event: JSON.parse(value.userConversation.event as string)
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

export function castComment(item: IComment) {
  return castDate(item, ['createdAt', 'updatedAt'])
}

export function castMessage(item: IEvent) {
  return _.chain(item)
    .thru(value => castDate(value, ['createdOn']))
    .thru(value => {
      value.event = JSON.parse(value.event as string)
      return value
    })
    .value()
}

export interface ApiType {
  getConfig: () => Promise<Config>
  setOnline: () => Promise<{ online: true }>
  setOffline: () => Promise<{ online: false }>
  getAgents: (online?: boolean) => Promise<IAgent[]>
  getCurrentAgent: () => Promise<IAgent>
  getComments: (id: string) => Promise<IComment[]>
  createComment: (id: string, payload: Partial<IComment>) => Promise<IComment>
  getEscalations: (column?: string, desc?: boolean, limit?: number) => Promise<IEscalation[]>
  assignEscalation: (id: string) => Promise<IEscalation>
  resolveEscalation: (id: string) => Promise<IEscalation>
  getMessages: (id: string, column?: string, desc?: boolean, limit?: number) => Promise<IEvent[]>
}

export const Api = (bp: { axios: AxiosInstance }): ApiType => {
  const config = {
    baseURL: bp.axios.defaults.baseURL.concat('/mod/hitl2')
  }

  return {
    getConfig: async () =>
      bp.axios
        .get('/modules/hitl2/config', { baseURL: window.API_PATH, params: { botId: window.BOT_ID } })
        .then(res => res.data),
    setOnline: async () => bp.axios.post('/agents/me/online', null, config).then(res => res.data),
    setOffline: async () => bp.axios.post('/agents/me/offline', null, config).then(res => res.data),
    getAgents: async (online?: boolean) =>
      bp.axios.get('/agents', { ...config, params: { online } }).then(res => res.data),
    getCurrentAgent: async () => bp.axios.get('/agents/me', config).then(res => res.data),
    getComments: async id =>
      bp.axios
        .get(`/escalations/${id}/comments`, config)
        .then(res => res.data)
        .then(data => data.map(item => castComment(item))),
    createComment: async (id, payload) =>
      bp.axios
        .post(`/escalations/${id}/comments`, payload, config)
        .then(res => res.data)
        .then(data => castComment(data)),
    getEscalations: async (column?, desc?, limit?) =>
      bp.axios
        .get('/escalations', {
          ...config,
          params: {
            desc,
            column,
            limit
          }
        })
        .then(res => res.data)
        .then(data => data.map(castEscalation)),
    assignEscalation: async id =>
      bp.axios
        .post(`/escalations/${id}/assign`, null, config)
        .then(res => res.data)
        .then(data => castEscalation(data)),
    resolveEscalation: async id =>
      bp.axios
        .post(`/escalations/${id}/resolve`, null, config)
        .then(res => res.data)
        .then(data => castEscalation(data)),
    getMessages: async (id, column?, desc?, limit?) =>
      bp.axios
        .get(`/conversations/${id}/messages`, { ...config, params: { desc, column, limit } })
        .then(res => res.data)
        .then(data => data.map(castMessage))
  }
}
