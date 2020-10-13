import axios from 'axios'
import _ from 'lodash'
import * as sdk from 'botpress/sdk'

import { AgentType, CommentType, EscalationType } from './../types'

import { makeAgentId } from './helpers'

export interface AgentCollectionConditions {
  online?: boolean
}

export interface CollectionConditions {
  limit?: number
  orderByColumn?: string
  orderByDirection?: string
}

export default class Repository {
  private escalationColumns: string[]
  private commentColumns: string[]
  private eventColumns: string[]
  private commentColumnsPrefixed: string[]
  private commentPrefix: string

  constructor(private bp: typeof sdk) {
    this.commentPrefix = 'comment:'

    this.escalationColumns = [
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

    this.commentColumns = ['id', 'agentId', 'content', 'createdAt', 'updatedAt']

    this.eventColumns = ['id', 'direction', 'botId', 'channel', 'success', 'createdOn', 'threadId', 'event']

    this.commentColumnsPrefixed = this.commentColumns.map(s => this.commentPrefix.concat(s))
  }

  private axiosConfig = async (req, botId: string): Promise<sdk.AxiosBotConfig> => {
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

  private applyLimit(query, limit?: number) {
    if (limit) {
      return query.limit(_.toNumber(limit))
    } else return query
  }

  private applyOrderBy(query, orderByColumn?: string, orderByDirection?: string) {
    if (orderByColumn) {
      return query.orderBy(orderByColumn)
    } else if (orderByColumn && orderByDirection) {
      return query.orderBy(orderByColumn, orderByDirection)
    } else return query
  }

  private hydrateComments(rows: any[]): any[] {
    const records = rows.reduce((memo, row) => {
      memo[row.id] = memo[row.id] || {
        ..._.pick(row, this.escalationColumns),
        comments: {}
      }

      if (row['comment:id']) {
        const record = _.mapKeys(_.pick(row, this.commentColumnsPrefixed), (v, k) => _.split(k, ':').pop())
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

  private hydrateEvents(rows: any[], escalations: any[], key: string) {
    const toMerge = rows.map(row => {
      return _.tap({}, item => {
        item['id'] = row['escalation:id']
        item[key] = _.pick(row, this.eventColumns)
      })
    })

    return _.merge(escalations, toMerge)
  }

  // To get the most recent event, we assume the 'Id' column is ordered;
  // thus meaning the highest Id is also the most recent
  private recentConversationQuery() {
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

  private userEventsQuery() {
    return this.bp
      .database('escalations')
      .select(
        'escalations.id as escalation:id',
        'escalations.userConversationId as escalation:userConversationId',
        'most_recent_event.*'
      )
      .join(
        this.recentConversationQuery().where('direction', 'incoming'),
        'escalations.userConversationId',
        'most_recent_event.threadId'
      )
  }

  private agentEventsQuery() {
    return this.bp
      .database('escalations')
      .select(
        'escalations.id as escalation:id',
        'escalations.agentConversationId as escalation:agentConversationId',
        'most_recent_event.*'
      )
      .join(
        this.recentConversationQuery().where('direction', 'incoming'),
        'escalations.agentConversationId',
        'most_recent_event.threadId'
      )
  }

  private escalationsWithCommentsQuery(botId: string, conditions: CollectionConditions = {}) {
    const { limit, orderByColumn, orderByDirection } = conditions

    return this.bp
      .database('escalations')
      .select(
        'escalations.*',
        `comments.id as ${this.commentPrefix}id`,
        `comments.agentId as ${this.commentPrefix}agentId`,
        `comments.content as ${this.commentPrefix}content`,
        `comments.updatedAt as ${this.commentPrefix}updatedAt`,
        `comments.createdAt as ${this.commentPrefix}createdAt`
      )
      .leftJoin('comments', 'escalations.id', 'comments.escalationId')
      .where('escalations.botId', botId)
      .distinct()
      .modify(this.applyLimit, limit)
      .modify(this.applyOrderBy, orderByColumn, orderByDirection)
      .orderBy([{ column: 'comments.createdAt', order: 'asc' }])
  }

  getAgentOnline = async (botId: string, agentId: string): Promise<boolean> => {
    const value = await this.bp.kvs.forBot(botId).get(`hitl2:online:${agentId}`)
    return !!value
  }

  setAgentOnline = async (botId: string, agentId: string, value: boolean): Promise<boolean> => {
    const config = await this.bp.config.getModuleConfigForBot('hitl2', botId)
    await this.bp.kvs.forBot(botId).set(`hitl2:online:${agentId}`, value, null, config.agentSessionTimeout)
    return value
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

  getAgents = async (botId: string, conditions: AgentCollectionConditions = {}): Promise<AgentType[]> => {
    let { online } = conditions

    const applyConditions = data => {
      if ('online' in conditions) {
        return _.filter(data, ['online', online])
      } else {
        return data
      }
    }

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
      .then(applyConditions)
  }

  getEscalations = async (botId: string, conditions: CollectionConditions = {}): Promise<EscalationType[]> => {
    return this.escalationsWithCommentsQuery(botId, conditions)
      .then(this.hydrateComments.bind(this))
      .then(async data => this.hydrateEvents(await this.userEventsQuery(), data, 'userConversation'))
      .then(async data => this.hydrateEvents(await this.agentEventsQuery(), data, 'agentConversation'))
      .then(data => data as EscalationType[])

  }

  getEscalation = (id: string): Promise<EscalationType> => {
    return this.bp
      .database('escalations')
      .where({ id: id })
      .first()
      .then(data => data as EscalationType)
  }

  createEscalation = async (attributes: Partial<EscalationType>): Promise<Partial<EscalationType>> => {
    const { botId } = attributes
    const now = new Date()
    const payload = this.castDate(
      {
        ...attributes,
        createdAt: now,
        updatedAt: now
      },
      ['assignedAt', 'resolvedAt', 'createdAt', 'updatedAt']
    )

    return this.bp
      .database('escalations')
      .select(this.bp.database.raw('last_insert_rowid() as id'))
      .insert(payload)
      .then(ids => {
        this.escalationsWithCommentsQuery(botId)
          .where({ id: _.head(ids) })
          .first()
      })
      .then(data => _.castArray(data))
      .then(this.hydrateComments.bind(this)) // Note: there won't be any comments yet, but an empty collection is required
      .then(async data => this.hydrateEvents(await this.userEventsQuery(), data, 'userConversation'))
      .then(async data => this.hydrateEvents(await this.agentEventsQuery(), data, 'agentConversation'))
      .then(data => _.head(data) as EscalationType)
  }

  updateEscalation = async (
    botId: string,
    id: string,
    attributes: Partial<EscalationType>
  ): Promise<Partial<EscalationType>> => {
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
      .then(() =>
        this.escalationsWithCommentsQuery(botId)
          .where({ id: id })
          .first()
      )
      .then(data => _.castArray(data))
      .then(this.hydrateComments.bind(this))
      .then(async data => this.hydrateEvents(await this.userEventsQuery(), data, 'userConversation'))
      .then(async data => this.hydrateEvents(await this.agentEventsQuery(), data, 'agentConversation'))
      .then(data => _.head(data) as EscalationType)
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
