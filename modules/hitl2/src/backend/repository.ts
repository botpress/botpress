import axios from 'axios'
import _ from 'lodash'
import Knex from 'knex'
import * as sdk from 'botpress/sdk'

import { AgentType, CommentType, EscalationType } from './../types'

import { makeAgentId } from './helpers'

export interface AgentCollectionConditions {
  online?: boolean
}

export interface CollectionConditions {
  limit?: number
  orderByColumn?: string
  orderByDirection?: 'asc' | 'desc'
}

export default class Repository {
  private escalationColumns: string[]
  private commentColumns: string[]
  private eventColumns: string[]
  private commentColumnsPrefixed: string[]
  private commentPrefix: string
  private escalationPrefix: string

  constructor(private bp: typeof sdk) {
    this.commentPrefix = 'comment'
    this.escalationPrefix = 'escalation'

    this.escalationColumns = [
      'id',
      'botId',
      'agentId',
      'userId',
      'userThreadId',
      'agentThreadId',
      'status',
      'assignedAt',
      'resolvedAt',
      'createdAt',
      'updatedAt'
    ]

    this.commentColumns = ['id', 'agentId', 'content', 'createdAt', 'updatedAt']

    this.eventColumns = ['id', 'direction', 'botId', 'channel', 'success', 'createdOn', 'threadId', 'event']

    this.commentColumnsPrefixed = this.commentColumns.map(s => this.commentPrefix.concat(':', s))
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

  private applyLimit(query: Knex.QueryBuilder, limit?: number) {
    if (limit) {
      return query.limit(_.toNumber(limit))
    } else return query
  }

  private applyOrderBy(query: Knex.QueryBuilder, orderByColumn?: string, orderByDirection?: string) {
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

      if (row[`${this.commentPrefix}:id`]) {
        const record = _.mapKeys(_.pick(row, this.commentColumnsPrefixed), (v, k) => _.split(k, ':').pop())
        memo[row.id].comments[row[`${this.commentPrefix}:id`]] = record
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
        item['id'] = row[`${this.escalationPrefix}:id`]
        item[key] = _.pick(row, this.eventColumns)
      })
    })

    return _.merge(escalations, toMerge)
  }

  // To get the most recent event, we assume the 'Id' column is ordered;
  // thus meaning the highest Id is also the most recent
  private recentConversationQuery(): Knex.QueryBuilder {
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
      .database<EscalationType>('escalations')
      .select(
        'escalations.id as escalation:id',
        'escalations.userThreadId as escalation:userThreadId',
        'most_recent_event.*'
      )
      .join(
        this.recentConversationQuery().where('direction', 'incoming'),
        'escalations.userThreadId',
        'most_recent_event.threadId'
      )
  }

  private escalationsWithCommentsQuery(botId: string, conditions: CollectionConditions = {}): Knex.QueryBuilder {
    const { limit, orderByColumn, orderByDirection } = conditions

    return this.bp
      .database('escalations')
      .select(
        'escalations.*',
        `comments.id as ${this.commentPrefix}:id`,
        `comments.agentId as ${this.commentPrefix}:agentId`,
        `comments.content as ${this.commentPrefix}:content`,
        `comments.updatedAt as ${this.commentPrefix}:updatedAt`,
        `comments.createdAt as ${this.commentPrefix}:createdAt`
      )
      .leftJoin('comments', 'escalations.id', 'comments.escalationId')
      .andWhere('escalations.botId', botId)
      .distinct()
      .modify(this.applyLimit, limit)
      .modify(this.applyOrderBy, orderByColumn, orderByDirection)
      .orderBy([{ column: 'comments.createdAt', order: 'asc' }])
  }

  private applyQuery = (query?: Knex.QueryCallback) => {
    return (builder: Knex.QueryBuilder) => {
      if (query) {
        return builder.modify(query)
      } else {
        return builder
      }
    }
  }

  escalationsQuery = async (query?: Knex.QueryCallback): Promise<EscalationType[]> => {
    return await this.bp.database<EscalationType>('escalations').modify(this.applyQuery(query))
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

    const applyConditions = (records: []) => {
      if ('online' in conditions) {
        return _.filter<AgentType>(records, ['online', online])
      } else {
        return records
      }
    }

    return await this.bp
      .database('workspace_users')
      .then(data => {
        return data.map(async row => {
          return {
            ...row,
            id: makeAgentId(row.strategy, row.email),
            online: await this.getAgentOnline(botId, makeAgentId(row.strategy, row.email))
          }
        })
      })
      .then(async agents => {
        const superAdmins = (await this.bp.config.getBotpressConfig()).superAdmins
        const admins = superAdmins.map(async admin => {
          return {
            ...admin,
            id: makeAgentId(admin.strategy, admin.email),
            online: await this.getAgentOnline(botId, makeAgentId(admin.strategy, admin.email)),
            workspace: 'default'
          }
        })

        return Promise.all([...agents, ...admins])
      })
      .then(applyConditions)
  }

  getEscalationsWithComments = async (
    botId: string,
    conditions: CollectionConditions = {},
    query?: Knex.QueryCallback
  ): Promise<EscalationType[]> => {
    return await this.bp.database
      .transaction(async trx => {
        return await this.escalationsWithCommentsQuery(botId, conditions)
          .modify(this.applyQuery(query))
          .transacting(trx)
          .then(this.hydrateComments.bind(this))
          .then(async data =>
            this.hydrateEvents(
              await this.userEventsQuery()
                .andWhere('escalations.botId', botId)
                .transacting(trx),
              data,
              'userConversation'
            )
          )
      })
      .then(data => data as EscalationType[])
  }

  getEscalationWithComments = async (
    botId: string,
    id: string,
    query?: Knex.QueryCallback
  ): Promise<EscalationType> => {
    return await this.escalationsWithCommentsQuery(botId)
      .andWhere('escalations.id', id)
      .modify(this.applyQuery(query))
      .then(this.hydrateComments.bind(this))
      .then(async data =>
        this.hydrateEvents(await this.userEventsQuery().andWhere('escalations.id', id), data, 'userConversation')
      )
      .then(data => _.head(data))
  }

  createEscalation = async (botId: string, attributes: Partial<EscalationType>): Promise<EscalationType> => {
    const now = new Date()
    const payload = this.castDate(
      {
        ...attributes,
        botId: botId,
        createdAt: now,
        updatedAt: now
      },
      ['assignedAt', 'resolvedAt', 'createdAt', 'updatedAt']
    )

    return await this.bp.database.transaction(async trx => {
      await trx('escalations').insert(payload)

      const ids = await trx
        .select(this.bp.database.raw('last_insert_rowid() as id'))
        .then(result => _.map(result, 'id'))

      return await trx('escalations')
        .where('botId', botId)
        .whereIn(['id'], ids as [])
        .then(this.hydrateComments.bind(this)) // Note: there won't be any comments yet, but an empty collection is required
        .then(async data =>
          this.hydrateEvents(
            await this.userEventsQuery()
              .whereIn(['escalations.id'], ids as [])
              .transacting(trx),
            data,
            'userConversation'
          )
        )
        .then(data => _.head(data))
    })
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

    return await this.bp.database.transaction(async trx => {
      await trx<EscalationType>('escalations')
        .where({ id: id })
        .update(payload)

      return await this.escalationsWithCommentsQuery(botId)
        .andWhere('escalations.id', id)
        .transacting(trx)
        .then(this.hydrateComments.bind(this))
        .then(async data =>
          this.hydrateEvents(
            await this.userEventsQuery()
              .andWhere('escalations.id', id)
              .transacting(trx),
            data,
            'userConversation'
          )
        )
        .then(data => _.head(data))
    })
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

    return this.bp.database.insertAndRetrieve<CommentType>('comments', payload, this.commentColumns)
  }
}
