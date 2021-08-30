import { AxiosInstance } from 'axios'
import _ from 'lodash'

import { Config } from '../config'
import { IAgent, IComment, IEvent, IHandoff } from '../types'

// TODO Handle casting when object is undefined
function castDate<T extends object>(object: T, paths: string[]): T {
  paths.forEach(path => {
    const dateStr = _.get(object, path, false)
    dateStr && _.set(object, path, new Date(dateStr))
  })
  return object
}

/**
 * Cast stringified properties to their native type
 */
export function castHandoff(item: IHandoff) {
  return _.chain(item)
    .thru(value =>
      castDate(value, ['createdAt', 'updatedAt', 'assignedAt', 'resolvedAt', 'userConversation.createdOn'])
    )
    .thru(value => {
      if (_.isEmpty(value.comments)) {
        return value
      }

      value.comments = _.castArray(value.comments).map(comment => castComment(comment))
      return value
    })
    .value()
}

/**
 * Cast stringified properties to their native type
 */
export function castComment(item: IComment) {
  return castDate(item, ['createdAt', 'updatedAt'])
}
export interface HitlClient {
  getConfig: () => Promise<Config>
  setOnline: (online: boolean) => Promise<{ online: boolean }>
  getAgents: (online?: boolean) => Promise<IAgent[]>
  getCurrentAgent: () => Promise<IAgent>
  getComments: (id: string) => Promise<IComment[]>
  createComment: (id: string, payload: Partial<IComment>) => Promise<IComment>
  getHandoffs: (column?: string, desc?: boolean, limit?: number) => Promise<IHandoff[]>
  assignHandoff: (id: string) => Promise<IHandoff>
  resolveHandoff: (id: string) => Promise<IHandoff>
  updateHandoff: (id: string, data: Partial<IHandoff>) => Promise<IHandoff>
  deleteMessagesInChannelWeb: (id: string, userId: string) => Promise<void>
  getMessages: (id: string, column?: string, desc?: boolean, limit?: number) => Promise<IEvent[]>
}

export const makeClient = (bp: { axios: AxiosInstance }): HitlClient => {
  const config = {
    baseURL: bp.axios.defaults.baseURL.concat('/mod/hitlnext')
  }

  return {
    getConfig: async () => bp.axios.get('/config', config).then(res => res.data),
    setOnline: async online => bp.axios.post('/agents/me/online', { online }, config).then(res => res.data),
    getAgents: async () => bp.axios.get('/agents', config).then(res => res.data),
    getCurrentAgent: async () => bp.axios.get('/agents/me', config).then(res => res.data),
    getComments: async id =>
      bp.axios
        .get(`/handoffs/${id}/comments`, config)
        .then(res => res.data)
        .then(data => data.map(item => castComment(item))),
    createComment: async (id, payload) =>
      bp.axios
        .post(`/handoffs/${id}/comments`, payload, config)
        .then(res => res.data)
        .then(data => castComment(data)),
    getHandoffs: async (column?, desc?, limit?) =>
      bp.axios
        .get('/handoffs', {
          ...config,
          params: {
            desc,
            column,
            limit
          }
        })
        .then(res => res.data)
        .then(data => data.map(castHandoff)),
    assignHandoff: async id =>
      bp.axios
        .post(`/handoffs/${id}/assign`, {}, config)
        .then(res => res.data)
        .then(data => castHandoff(data)),
    resolveHandoff: async id =>
      bp.axios
        .post(`/handoffs/${id}/resolve`, null, config)
        .then(res => res.data)
        .then(data => castHandoff(data)),
    updateHandoff: async (id, payload) =>
      bp.axios
        .post(`/handoffs/${id}`, payload, config)
        .then(res => res.data)
        .then(data => castHandoff(data)),
    deleteMessagesInChannelWeb: async (id, userId) =>
      bp.axios.post(
        `/conversations/${id}/messages/delete`,
        { userId },
        {
          baseURL: bp.axios.defaults.baseURL.concat('/mod/channel-web-private')
        }
      ),
    getMessages: async (id, column?, desc?, limit?) =>
      bp.axios
        .get(`/conversations/${id}/messages`, { ...config, params: { desc, column, limit } })
        .then(res => res.data)
  }
}
