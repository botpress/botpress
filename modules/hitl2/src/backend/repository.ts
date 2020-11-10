import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { SortOrder } from 'botpress/sdk'
import Knex from 'knex'
import _ from 'lodash'

import { AgentType, CommentType, EscalationType } from './../types'
import { makeAgentId } from './helpers'

export interface AgentCollectionConditions {
  online?: boolean
}

export interface CollectionConditions extends Partial<SortOrder> {
  limit?: number
}

export default class Repository {
  private readonly escalationColumns: string[]
  private readonly commentColumns: string[]
  private readonly eventColumns: string[]
  private readonly commentColumnsPrefixed: string[]
  private readonly commentPrefix: string
  private readonly escalationPrefix: string

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

    this.commentColumns = ['id', 'agentId', 'escalationId', 'threadId', 'content', 'createdAt', 'updatedAt']

    this.eventColumns = ['id', 'direction', 'botId', 'channel', 'success', 'createdOn', 'threadId', 'type', 'event']

    this.commentColumnsPrefixed = this.commentColumns.map(s => this.commentPrefix.concat(':', s))
  }

  private axiosConfig = (req, botId: string): sdk.AxiosBotConfig => {
    return {
      baseURL: `${process.LOCAL_URL}/api/v1`,
      headers: {
        Authorization: req.headers.authorization,
        'X-BP-Workspace': req.workspace
      }
    }
  }

  // This mutates object
  private castDate(object, paths) {
    paths.map(path => {
      _.has(object, path) && _.set(object, path, this.bp.database.date.format(_.get(object, path)))
    })
    return object
  }

  private applyLimit(query: Knex.QueryBuilder, conditions?: CollectionConditions) {
    if (conditions.limit) {
      return query.limit(_.toNumber(conditions.limit))
    } else {
      return query
    }
  }

  private applyOrderBy(query: Knex.QueryBuilder, conditions?: CollectionConditions) {
    if (_.has(conditions, 'column') && _.has(conditions, 'desc')) {
      return query.orderBy(conditions.column, conditions.desc ? 'desc' : 'asc')
    } else if (_.has(conditions, 'column')) {
      return query.orderBy(conditions.column)
    } else {
      return query
    }
  }

  // This mutates rows
  private hydrateComments(rows: any[]): EscalationType[] {
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

  // This mutates escalations
  private hydrateEvents(events: any[], escalations: any[], key: string): any[] {
    escalations.forEach(escalation => (escalation.userConversation = {}))

    const toMerge = events.map(event => {
      return _.tap({}, item => {
        item['id'] = event[`${this.escalationPrefix}:id`]
        item[key] = _.pick(event, this.eventColumns)
      })
    })

    return _.values(_.merge(_.keyBy(escalations, 'id'), _.keyBy(toMerge, 'id')))
  }

  // To get the most recent event, we assume the 'Id' column is ordered;
  // thus meaning the highest Id is also the most recent.
  //
  // - Note: We're interested in 'incoming' & 'text' events only
  private recentEventQuery() {
    return this.bp
      .database<sdk.IO.StoredEvent>('events')
      .select('*')
      .where('direction', 'incoming')
      .andWhere(function() {
        this.whereIn('id', function() {
          this.max('id')
            .from('events')
            .where('type', 'text')
            .groupBy('threadId')
        })
      })
      .as('recent_event')
  }

  private userEventsQuery(): Knex.QueryBuilder {
    return this.bp
      .database<EscalationType>('escalations')
      .select(
        'escalations.id as escalation:id',
        'escalations.userThreadId as escalation:userThreadId',
        'recent_event.*'
      )
      .join(this.recentEventQuery(), 'escalations.userThreadId', 'recent_event.threadId')
  }

  private escalationsWithCommentsQuery(botId: string, conditions: CollectionConditions = {}) {
    return this.bp
      .database<EscalationType>('escalations')
      .select(
        'escalations.*',
        `comments.id as ${this.commentPrefix}:id`,
        `comments.agentId as ${this.commentPrefix}:agentId`,
        `comments.escalationId as ${this.commentPrefix}:escalationId`,
        `comments.threadId as ${this.commentPrefix}:threadId`,
        `comments.content as ${this.commentPrefix}:content`,
        `comments.updatedAt as ${this.commentPrefix}:updatedAt`,
        `comments.createdAt as ${this.commentPrefix}:createdAt`
      )
      .leftJoin('comments', 'escalations.userThreadId', 'comments.threadId')
      .where('escalations.botId', botId)
      .distinct()
      .modify(this.applyLimit, conditions)
      .modify(this.applyOrderBy, conditions)
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

  escalationsQuery = (query?: Knex.QueryCallback) => {
    return this.bp.database<EscalationType>('escalations').modify(this.applyQuery(query))
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

    const { data } = await axios.get('/auth/me/profile', this.axiosConfig(req, botId))
    return {
      ...data.payload,
      id: agentId,
      online
    } as AgentType
  }

  getAgents = async (botId: string, conditions: AgentCollectionConditions = {}): Promise<AgentType[]> => {
    const { online } = conditions

    const applyConditions = (records: []) => {
      if ('online' in conditions) {
        return _.filter<AgentType>(records, ['online', online])
      } else {
        return records
      }
    }

    return this.bp
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
    return this.bp.database
      .transaction(async trx => {
        return this.escalationsWithCommentsQuery(botId, conditions)
          .modify(this.applyQuery(query))
          .transacting(trx)
          .then(this.hydrateComments.bind(this))
          .then(async data =>
            this.hydrateEvents(
              await this.userEventsQuery()
                .where('escalations.botId', botId)
                .transacting(trx),
              data,
              'userConversation'
            )
          )
      })
      .then(async data => data as EscalationType[])
  }

  getEscalationWithComments = async (
    botId: string,
    id: string,
    query?: Knex.QueryCallback
  ): Promise<EscalationType> => {
    return this.escalationsWithCommentsQuery(botId)
      .andWhere('escalations.id', id)
      .modify(this.applyQuery(query))
      .then(this.hydrateComments.bind(this))
      .then(async data =>
        this.hydrateEvents(await this.userEventsQuery().where('escalations.id', id), data, 'userConversation')
      )
      .then(async data => _.head(data))
  }

  getEscalation = async (id: string, query?: Knex.QueryCallback): Promise<EscalationType> => {
    return this.escalationsQuery(builder => {
      builder.where('id', id).modify(this.applyQuery(query))
    }).then(data => _.head(data))
  }

  createEscalation = async (botId: string, attributes: Partial<EscalationType>): Promise<EscalationType> => {
    const now = new Date()
    const payload = this.castDate(
      {
        ...attributes,
        botId,
        createdAt: now,
        updatedAt: now
      },
      ['assignedAt', 'resolvedAt', 'createdAt', 'updatedAt']
    )

    return this.bp.database.transaction(async trx => {
      await trx('escalations').insert(payload)

      const id = await trx
        .select(this.bp.database.raw('last_insert_rowid() as id'))
        .then(result => _.head(_.map(result, 'id')))

      return trx('escalations')
        .where('botId', botId)
        .where('id', id)
        .then(this.hydrateComments.bind(this)) // Note: there won't be any comments yet, but an empty collection is required
        .then(async data =>
          this.hydrateEvents(
            await this.userEventsQuery()
              .where('escalations.id', id)
              .transacting(trx),
            data,
            'userConversation'
          )
        )
        .then(async data => _.head(data))
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

    return this.bp.database.transaction(async trx => {
      await trx<EscalationType>('escalations')
        .where({ id })
        .update(payload)

      return this.escalationsWithCommentsQuery(botId)
        .andWhere('escalations.id', id)
        .transacting(trx)
        .then(this.hydrateComments.bind(this))
        .then(async data =>
          this.hydrateEvents(
            await this.userEventsQuery()
              .where('escalations.id', id)
              .transacting(trx),
            data,
            'userConversation'
          )
        )
        .then(async data => _.head(data))
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

  getMessages = (botId: string, id: string, conditions: CollectionConditions = {}) => {
    return this.bp
      .database<sdk.IO.StoredEvent>('events')
      .select('*')
      .where('botId', botId)
      .andWhere('threadId', id)
      .modify(this.applyLimit, conditions)
      .modify(this.applyOrderBy, conditions)
  }
}
