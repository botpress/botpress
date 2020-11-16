import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { SortOrder } from 'botpress/sdk'
import { BPRequest } from 'common/http'
import Knex from 'knex'
import _ from 'lodash'

import { IAgent, IComment, IEscalation } from './../types'
import { makeAgentId } from './helpers'
import { cacheKey } from './agentSession'

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
      'userChannel',
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
  private hydrateComments(rows: any[]): IEscalation[] {
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
      .database<IEscalation>('escalations')
      .select(
        'escalations.id as escalation:id',
        'escalations.userThreadId as escalation:userThreadId',
        'recent_event.*'
      )
      .join(this.recentEventQuery(), 'escalations.userThreadId', 'recent_event.threadId')
  }

  private escalationsWithCommentsQuery(botId: string, conditions: CollectionConditions = {}) {
    return this.bp
      .database<IEscalation>('escalations')
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
    return this.bp.database<IEscalation>('escalations').modify(this.applyQuery(query))
  }

  // hitl2:online:workspaceId:agentId
  agentSessionCacheKey = async (botId: string, agentId: string) => {
    return ['hitl2', 'online', cacheKey(await this.bp.workspaces.getBotWorkspaceId(botId), botId, agentId)].join(':')
  }

  getAgentOnline = async (botId: string, agentId: string): Promise<boolean> => {
    const value = await this.bp.kvs.forBot(botId).get(await this.agentSessionCacheKey(botId, agentId))
    return !!value
  }

  setAgentOnline = async (botId: string, agentId: string, value: boolean): Promise<boolean> => {
    const config = await this.bp.config.getModuleConfigForBot('hitl2', botId)
    await this.bp.kvs
      .forBot(botId)
      .set(await this.agentSessionCacheKey(botId, agentId), value, null, config.agentSessionTimeout)
    return value
  }

  // This returns an agent with the following additional properties:
  // - isSuperAdmin
  // - permissions
  // - strategyType
  getCurrentAgent = async (req: BPRequest, botId: string, agentId: string): Promise<IAgent> => {
    const online = await this.getAgentOnline(botId, agentId)

    const { data } = await axios.get('/auth/me/profile', {
      baseURL: `${process.LOCAL_URL}/api/v1`,
      headers: {
        Authorization: req.headers.authorization,
        'X-BP-Workspace': req.workspace
      }
    })

    return {
      ...data.payload,
      agentId,
      online
    } as IAgent
  }

  // Fetch a list of agents, missing these properties:
  // - permissions
  // - strategyType
  getAgents = async (
    botId: string,
    workspace: string,
    conditions: AgentCollectionConditions = {}
  ): Promise<Partial<IAgent>[]> => {
    const { online } = conditions

    const applyConditions = (records: []) => {
      if ('online' in conditions) {
        return _.filter<IAgent>(records, ['online', online])
      } else {
        return records
      }
    }

    const getUsers = async (strategy: string, emails: string[]) => {
      const users = await this.bp
        .database(`strategy_${strategy}`)
        .select('*')
        .whereIn('email', emails)

      return users.map(user => ({
        ...user,
        attributes: this.bp.database.json.get(user.attributes)
      }))
    }

    return this.bp.workspaces
      .getWorkspaceUsersWithAttributes(workspace, ['firstname', 'lastname'])
      .then(agents => {
        return agents.map(agent => {
          return {
            ...agent,
            isSuperAdmin: false
          }
        })
      })
      .then(async agents => {
        const superAdmins = _.keyBy((await this.bp.config.getBotpressConfig()).superAdmins, 'strategy')
        const strategies = _.keys(superAdmins)

        const hydrated = _.flatten(
          await Promise.mapSeries(strategies, async strategy => {
            const emails = _.map(_.castArray(superAdmins[strategy]), 'email')
            return getUsers(strategy, emails)
          })
        ).map(user => {
          return {
            ..._.pick(user, 'email', 'strategy'),
            isSuperAdmin: true,
            attributes: _.pick(user.attributes, 'firstname', 'lastname', 'created_on', 'updated_on')
          }
        })

        return [...agents, ...hydrated]
      })
      .then(data => {
        return Promise.all(
          data.map(async row => {
            return {
              ...row,
              agentId: makeAgentId(row.strategy, row.email),
              online: await this.getAgentOnline(botId, makeAgentId(row.strategy, row.email))
            }
          })
        )
      })
      .then(applyConditions)
  }

  getEscalationsWithComments = async (
    botId: string,
    conditions: CollectionConditions = {},
    query?: Knex.QueryCallback
  ): Promise<IEscalation[]> => {
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
      .then(async data => data as IEscalation[])
  }

  getEscalationWithComments = async (botId: string, id: string, query?: Knex.QueryCallback): Promise<IEscalation> => {
    return this.escalationsWithCommentsQuery(botId)
      .andWhere('escalations.id', id)
      .modify(this.applyQuery(query))
      .then(this.hydrateComments.bind(this))
      .then(async data =>
        this.hydrateEvents(await this.userEventsQuery().where('escalations.id', id), data, 'userConversation')
      )
      .then(async data => _.head(data))
  }

  getEscalation = async (id: string, query?: Knex.QueryCallback): Promise<IEscalation> => {
    return this.escalationsQuery(builder => {
      builder.where('id', id).modify(this.applyQuery(query))
    }).then(data => _.head(data))
  }

  createEscalation = async (botId: string, attributes: Partial<IEscalation>): Promise<IEscalation> => {
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
    attributes: Partial<IEscalation>
  ): Promise<Partial<IEscalation>> => {
    const now = new Date()
    const payload = this.castDate(
      {
        ...attributes,
        updatedAt: now
      },
      ['assignedAt', 'resolvedAt', 'updatedAt']
    )

    return this.bp.database.transaction(async trx => {
      await trx<IEscalation>('escalations')
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

  createComment = (attributes: Partial<IComment>): Promise<IComment> => {
    const now = new Date()
    const payload = this.castDate(
      {
        ...attributes,
        updatedAt: now,
        createdAt: now
      },
      ['updatedAt', 'createdAt']
    )

    return this.bp.database.insertAndRetrieve<IComment>('comments', payload, this.commentColumns)
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
