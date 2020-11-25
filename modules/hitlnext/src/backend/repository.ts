import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { SortOrder } from 'botpress/sdk'
import { BPRequest } from 'common/http'
import Knex from 'knex'
import _ from 'lodash'

import { MODULE_NAME } from '../constants'

import { IAgent, IComment, IHandoff } from './../types'
import { buildCacheKey } from './agentSession'
import { makeAgentId } from './helpers'

export interface AgentCollectionConditions {
  online?: boolean
}

export interface CollectionConditions extends Partial<SortOrder> {
  limit?: number
}

export default class Repository {
  private readonly handoffColumns: string[]
  private readonly commentColumns: string[]
  private readonly userColumns: string[]
  private readonly eventColumns: string[]
  private readonly commentColumnsPrefixed: string[]
  private readonly userColumnsPrefixed: string[]
  private readonly commentPrefix: string
  private readonly handoffPrefix: string
  private readonly userPrefix: string

  constructor(private bp: typeof sdk) {
    this.commentPrefix = 'comment'
    this.handoffPrefix = 'handoff'
    this.userPrefix = 'user'

    this.handoffColumns = [
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

    this.commentColumns = ['id', 'agentId', 'handoffId', 'threadId', 'content', 'createdAt', 'updatedAt']

    this.eventColumns = ['id', 'direction', 'botId', 'channel', 'success', 'createdOn', 'threadId', 'type', 'event']

    this.userColumns = ['id', 'attributes']

    this.commentColumnsPrefixed = this.commentColumns.map(s => this.commentPrefix.concat(':', s))

    this.userColumnsPrefixed = this.userColumns.map(s => this.userPrefix.concat(':', s))
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

  private applyQuery = (query?: Knex.QueryCallback) => {
    return (builder: Knex.QueryBuilder) => {
      if (query) {
        return builder.modify(query)
      } else {
        return builder
      }
    }
  }

  // This mutates rows
  private hydrateHandoffs(rows: any[]): IHandoff[] {
    const records = rows.reduce((memo, row) => {
      memo[row.id] = memo[row.id] || {
        ..._.pick(row, this.handoffColumns),
        comments: {}
      }

      if (row[`${this.commentPrefix}:id`]) {
        const record = _.mapKeys(_.pick(row, this.commentColumnsPrefixed), (v, k) => _.split(k, ':').pop())
        memo[row.id].comments[row[`${this.commentPrefix}:id`]] = record
      }

      if (row[`${this.userPrefix}:id`]) {
        const record = _.mapKeys(_.pick(row, this.userColumnsPrefixed), (v, k) => _.split(k, ':').pop())
        record.attributes = this.bp.database.json.get(record.attributes) // Parse json

        memo[row.id].user = record
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

  // This mutates handoffs
  private hydrateEvents<T>(events: any[], handoffs: any[], key: string): T[] {
    handoffs.forEach(handoff => (handoff[key] = {}))

    const toMerge = events.map(event => {
      return _.tap({}, item => {
        const record = _.pick(event, this.eventColumns)
        record.event = this.bp.database.json.get(record.event)

        item['id'] = event[`${this.handoffPrefix}:id`]
        item[key] = record
      })
    })

    return _.values(_.merge(_.keyBy(handoffs, 'id'), _.keyBy(toMerge, 'id')))
  }

  // To get the most recent event, we assume the 'Id' column is ordered;
  // thus meaning the highest Id is also the most recent.
  //
  // - Note: We're interested in 'incoming' & 'text' events only
  private recentEventQuery() {
    return this.bp
      .database<sdk.IO.StoredEvent>('events')
      .select('*')
      .andWhere(function() {
        this.whereIn('id', function() {
          this.max('id')
            .from('events')
            .where('type', 'text')
            .andWhere('direction', 'incoming')
            .groupBy('threadId')
        })
      })
      .as('recent_event')
  }

  private userEventsQuery(): Knex.QueryBuilder {
    return this.bp
      .database<IHandoff>('handoffs')
      .select('handoffs.id as handoff:id', 'handoffs.userThreadId as handoff:userThreadId', 'recent_event.*')
      .join(this.recentEventQuery(), 'handoffs.userThreadId', 'recent_event.threadId')
  }

  private handoffsWithAssociationsQuery(botId: string, conditions: CollectionConditions = {}) {
    return this.bp
      .database<IHandoff>('handoffs')
      .select(
        'handoffs.*',
        `comments.id as ${this.commentPrefix}:id`,
        `comments.agentId as ${this.commentPrefix}:agentId`,
        `comments.handoffId as ${this.commentPrefix}:handoffId`,
        `comments.threadId as ${this.commentPrefix}:threadId`,
        `comments.content as ${this.commentPrefix}:content`,
        `comments.updatedAt as ${this.commentPrefix}:updatedAt`,
        `comments.createdAt as ${this.commentPrefix}:createdAt`,
        `srv_channel_users.user_id as ${this.userPrefix}:id`,
        `srv_channel_users.attributes as ${this.userPrefix}:attributes`
      )
      .leftJoin('comments', 'handoffs.userThreadId', 'comments.threadId')
      .leftJoin('srv_channel_users', 'handoffs.userId', 'srv_channel_users.user_id')
      .where('handoffs.botId', botId)
      .modify(this.applyLimit, conditions)
      .modify(this.applyOrderBy, conditions)
      .orderBy([{ column: 'comments.createdAt', order: 'asc' }])
  }

  private findHandoffs(
    botId: string,
    conditions: CollectionConditions = {},
    query?: Knex.QueryCallback,
    trx?: Knex.Transaction
  ) {
    const execute = async (trx: Knex.Transaction) => {
      const data = await this.handoffsWithAssociationsQuery(botId, conditions)
        .modify(this.applyQuery(query))
        .transacting(trx)
        .then(this.hydrateHandoffs.bind(this))

      const hydrated = this.hydrateEvents<IHandoff>(
        await this.userEventsQuery()
          .where('handoffs.botId', botId)
          .transacting(trx),
        data,
        'userConversation'
      )

      return hydrated
    }

    // Either join an existing transaction or start one
    if (trx) {
      return execute(trx)
    } else {
      return this.bp.database.transaction(trx => execute(trx))
    }
  }

  private async findHandoff(botId: string, id: string, trx?: Knex.Transaction) {
    return this.findHandoffs(botId, undefined, builder => builder.andWhere('handoffs.id', id), trx).then(data =>
      _.head(data)
    )
  }

  handoffsQuery = (query?: Knex.QueryCallback) => {
    return this.bp.database<IHandoff>('handoffs').modify(this.applyQuery(query))
  }

  // hitlnext:online:workspaceId:agentId
  agentSessionCacheKey = async (botId: string, agentId: string) => {
    return [MODULE_NAME, 'online', buildCacheKey(await this.bp.workspaces.getBotWorkspaceId(botId), agentId)].join(':')
  }

  getAgentOnline = async (botId: string, agentId: string): Promise<boolean> => {
    const value = await this.bp.kvs.forBot(botId).get(await this.agentSessionCacheKey(botId, agentId))
    return !!value
  }

  setAgentOnline = async (botId: string, agentId: string, value: boolean): Promise<boolean> => {
    const config = await this.bp.config.getModuleConfigForBot(MODULE_NAME, botId)
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
      online: await this.getAgentOnline(botId, agentId)
    } as IAgent
  }

  getAgents = async (botId: string, workspace: string): Promise<Partial<IAgent>[]> => {
    const options: sdk.GetWorkspaceUsersOptions = {
      includeSuperAdmins: true,
      attributes: ['firstname', 'lastname', 'created_at', 'updated_at']
    }

    // TODO filter out properly this is a quick fix
    const users = (await this.bp.workspaces.getWorkspaceUsers(workspace, options)).filter(
      u => u.role === 'admin' || u.role === 'admin'
    )
    // @ts-ignore
    return Promise.map(users, async user => {
      const agentId = makeAgentId(user.strategy, user.email)
      return {
        ...user,
        agentId,
        online: await this.getAgentOnline(botId, agentId)
      }
    })
  }

  getHandoffsWithAssociations = (botId: string, conditions: CollectionConditions = {}, query?: Knex.QueryCallback) => {
    return this.findHandoffs(botId, conditions, query)
  }

  getHandoffWithAssociations = (botId: string, id: string) => {
    return this.findHandoff(botId, id)
  }

  getHandoff = (id: string, query?: Knex.QueryCallback) => {
    return this.handoffsQuery(builder => {
      builder.where('id', id).modify(this.applyQuery(query))
    }).then(data => _.head(data) as IHandoff)
  }

  createHandoff = async (botId: string, attributes: Partial<IHandoff>) => {
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
      const id = await this.bp.database.insertAndRetrieve<string>('handoffs', payload, 'id', 'id', trx)
      return await this.findHandoff(botId, id, trx)
    })
  }

  updateHandoff = async (botId: string, id: string, attributes: Partial<IHandoff>) => {
    const now = new Date()
    const payload = this.castDate(
      {
        ...attributes,
        updatedAt: now
      },
      ['assignedAt', 'resolvedAt', 'updatedAt']
    )

    return this.bp.database.transaction(async trx => {
      await trx<IHandoff>('handoffs')
        .where({ id })
        .update(payload)
      return await this.findHandoff(botId, id, trx)
    })
  }

  createComment = (attributes: Partial<IComment>) => {
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

  getMessages = (botId: string, threadId: string, conditions: CollectionConditions = {}) => {
    return this.bp.events.findEvents(
      { botId, threadId },
      { count: conditions.limit, sortOrder: [{ column: 'id', desc: true }] }
    )
  }
}
