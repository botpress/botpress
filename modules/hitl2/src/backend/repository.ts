import axios from 'axios'
import _ from 'lodash'
import * as sdk from 'botpress/sdk'

import { AgentType, CommentType, EscalationType } from './../types'

import { makeAgentId } from './helpers'

export default class Repository {
  constructor(private bp: typeof sdk) {}

  private escalationColumns = [
    'id',
    'botId',
    'agentId',
    'userConversationId',
    'agentConversationId',
    'status',
    'assignedAt',
    'resolvedAt',
    'createdAt',
    'updatedAt'
  ]

  private commentColumns = ['id', 'agentId', 'content', 'createdAt', 'updatedAt']

  private eventColumns = ['id', 'direction', 'botId', 'channel', 'success', 'createdOn', 'threadId', 'event']

  private axiosConfig = async (req, botId: string) => {
    const config = await this.bp.http.getAxiosConfigForBot(botId, { localUrl: true })
    config.baseURL = _.trim(config.baseURL, `/bots/${botId}`)
    config.headers['Authorization'] = req.headers.authorization
    config.headers['X-BP-Workspace'] = req.workspace
    return config
  }

  private castDate(object, paths) {
    paths.map(path => {
      _.has(object, path) && _.set(object, path, this.bp.database.date.format(_.get(object, path)))
    })
    return object
  }

  getAgentOnline = async (botId: string, agentId: string): Promise<boolean> => {
    const val = await this.bp.kvs.forBot(botId).get(`hitl2:online:${agentId}`)
    return !!val
  }

  setAgentOnline = async (botId: string, agentId: string, value: boolean): Promise<void> => {
    const config = await this.bp.config.getModuleConfigForBot('hitl2', botId)
    return this.bp.kvs.forBot(botId).set(`hitl2:online:${agentId}`, value, null, config.agentSessionTimeout)
  }

  getCurrentAgent = async (req, botId: string, agentId: string): Promise<AgentType> => {
    const online = await this.getAgentOnline(botId, agentId)

    return axios
      .get('/auth/me/profile', await this.axiosConfig(req, botId))
      .then(response => response.data.payload)
      .then(data => {
        return {
          ...data,
          id: agentId,
          online: online
        } as AgentType
      })
  }

  getAgents = async (botId: string): Promise<AgentType[]> => {
    return this.bp
      .database('workspace_users')
      .then(data => {
        return Promise.all(
          data.map(async row => {
            return {
              ...row,
              id: makeAgentId(row.strategy, row.email),
              online: await this.getAgentOnline(botId, makeAgentId(row.strategy, row.email))
            }
          })
        )
      })
      .then(async agents => {
        const admins = (await this.bp.config.getBotpressConfig()).superAdmins.map(admin => {
          return {
            ...admin,
            id: makeAgentId(admin.strategy, admin.email),
            online: this.getAgentOnline(botId, makeAgentId(admin.strategy, admin.email)),
            workspace: 'default'
          }
        })

        return agents.concat(admins)
      })
  }

  getEscalations = async (botId: string): Promise<EscalationType[]> => {
    const commentPrefix = 'comment:'
    const commentColumnsPrefixed = _.map(this.commentColumns, s => commentPrefix.concat(s))

    const hydrateComments = (rows: any[]) => {
      const records = rows.reduce((memo, row) => {
        memo[row.id] = memo[row.id] || {
          ..._.pick(row, this.escalationColumns),
          comments: {}
        }

        if (row['comment:id']) {
          const record = _.mapKeys(_.pick(row, commentColumnsPrefixed), (v, k) => _.split(k, ':').pop())
          memo[row.id].comments[row['comment:id']] = record
        }

        return memo
      }, {})

      return _.values(records).map(record => {
        return {
          ...record,
          comments: _.values(record.comments)
        }
      })
    }

    const hydrateEvents = (rows: any[], escalations: any[], key: string) => {
      const toMerge = _.map(rows, row => {
        return _.tap({}, item => {
          item['id'] = row['escalation:id']
          item[key] = _.pick(row, this.eventColumns)
        })
      })

      return _.merge(escalations, toMerge)
    }

    const recentConversationQuery = () => {
      return this.bp
        .database('events')
        .select('*')
        .whereIn('id', function() {
          this.max('id')
            .from('events')
            .groupBy('threadId')
        })
        .as('most_recent_event')
    }

    const fetchUserEvents = (escalations: any[]) => {
      return this.bp
        .database('escalations')
        .select(
          'escalations.id as escalation:id',
          'escalations.userConversationId as escalation:userConversationId',
          'most_recent_event.*'
        )
        .join(
          recentConversationQuery().where('direction', 'incoming'),
          'escalations.userConversationId',
          'most_recent_event.threadId'
        )
        .then(data => hydrateEvents(data, escalations, 'userConversation'))
    }

    const fetchAgentEvents = (escalations: any[]) => {
      return this.bp
        .database('escalations')
        .select(
          'escalations.id as escalation:id',
          'escalations.agentConversationId as escalation:agentConversationId',
          'most_recent_event.*'
        )
        .join(
          recentConversationQuery().where('direction', 'incoming'),
          'escalations.agentConversationId',
          'most_recent_event.threadId'
        )
        .then(data => hydrateEvents(data, escalations, 'agentConversation'))
    }

    const escalations = await this.bp
      .database('escalations')
      .select(
        'escalations.*',
        `comments.id as ${commentPrefix}id`,
        `comments.agentId as ${commentPrefix}agentId`,
        `comments.content as ${commentPrefix}content`,
        `comments.updatedAt as ${commentPrefix}updatedAt`,
        `comments.createdAt as ${commentPrefix}createdAt`
      )
      .leftJoin('comments', 'escalations.id', 'comments.escalationId')
      .where('escalations.botId', botId)
      .distinct()
      .then(hydrateComments)
      .then(data => fetchUserEvents(data))
      .then(data => fetchAgentEvents(data))
      .then(data => data as EscalationType[])

    return escalations
  }

  getEscalation = (id: string): Promise<EscalationType> => {
    return this.bp
      .database('escalations')
      .where({ id: id })
      .first()
      .then(data => data as EscalationType)
  }

  createEscalation = async (attributes: Partial<EscalationType>): Promise<Partial<EscalationType>> => {
    const now = new Date()
    const payload = this.castDate(
      {
        ...attributes,
        createdAt: now,
        updatedAt: now
      },
      ['assignedAt', 'resolvedAt', 'createdAt', 'updatedAt']
    )

    return this.bp.database
      .insertAndRetrieve('escalations', payload, this.escalationColumns)
      .then(data => data as EscalationType)
  }

  updateEscalation = async (id: string, attributes: Partial<EscalationType>): Promise<Partial<EscalationType>> => {
    const now = new Date()
    const payload = this.castDate(
      {
        ...attributes,
        updatedAt: now
      },
      ['assignedAt', 'resolvedAt', 'updatedAt']
    )

    return this.bp
      .database('escalations')
      .where({ id: id })
      .update(payload)
      .then(() => {
        return this.bp
          .database('escalations')
          .where({ id: id })
          .first()
      })
      .then(data => data as EscalationType)
  }

  createComment = (attributes: Partial<CommentType>): Promise<CommentType> => {
    const now = new Date()
    const payload = this.castDate(
      {
        ...attributes,
        updatedAt: now,
        createdAt: now
      },
      ['updatedAt', 'createdAt']
    )

    return this.bp.database
      .insertAndRetrieve('comments', payload, this.commentColumns)
      .then(data => data as CommentType)
  }
}
