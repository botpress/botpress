import { Paging } from 'botpress/sdk'
import { inject, injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'

import Database from '../database'
import { TYPES } from '../types'

export type StrategyUser = {
  id?: number
  password?: string
  salt?: string
} & UserInfo

interface UserInfo {
  email: string
  strategy: string
  createdOn?: string
  updatedOn?: string
  attributes: any
}

@injectable()
export class StrategyUsersRepository {
  constructor(@inject(TYPES.Database) private database: Database) {}

  private _getTableName(strategy) {
    return `strategy_${strategy}`
  }

  async createUser(user: StrategyUser): Knex.GetOrCreateResult<StrategyUser> {
    const newUser = await this.database.knex
      .insertAndRetrieve<StrategyUser>(
        this._getTableName(user.strategy),
        {
          email: user.email,
          strategy: user.strategy,
          password: user.password,
          salt: user.salt,
          attributes: this.database.knex.json.set(user.attributes || {})
        },
        ['email', 'password', 'salt', 'strategy', 'attributes', 'created_at', 'updated_at']
      )
      .then(res => {
        return {
          email: res.email,
          strategy: res.strategy,
          password: res.password,
          salt: res.salt,
          attributes: res.attributes,
          createdOn: res['created_at'],
          updatedOn: res['updated_at']
        }
      })

    return { result: { ...newUser, createdOn: newUser.createdOn, updatedOn: newUser.updatedOn }, created: true }
  }

  async updateUser(email: string, strategy: string, updated: any): Promise<void> {
    await this.database
      .knex(this._getTableName(strategy))
      .where({ email, strategy })
      .update(updated)
  }

  async deleteUser(email: string, strategy: string): Promise<void> {
    return this.database
      .knex(this._getTableName(strategy))
      .where({ email, strategy })
      .del()
  }

  async getAttributes(email: string, strategy: string): Promise<any> {
    const user = await this.database
      .knex(this._getTableName(strategy))
      .where({ email, strategy })
      .limit(1)
      .select('attributes')
      .first()

    return this.database.knex.json.get(user.attributes)
  }

  async getMultipleUserAttributes(
    emails: string[],
    strategy: string,
    filteredAttributes?: string[]
  ): Promise<UserInfo[]> {
    const users: StrategyUser[] = await this.database.knex(this._getTableName(strategy)).whereIn('email', emails)
    const json = this.database.knex.json

    return users.map(user => ({
      strategy,
      email: user.email,
      createdOn: user['created_at'],
      updatedOn: user['updated_at'],
      attributes: filteredAttributes ? _.pick(json.get(user.attributes), filteredAttributes) : json.get(user.attributes)
    }))
  }

  async updateAttributes(email: string, strategy: string, attributes: any): Promise<void> {
    const originalAttributes = await this.getAttributes(email, strategy)

    return this.database
      .knex(this._getTableName(strategy))
      .where({ email, strategy })
      .update({ attributes: this.database.knex.json.set({ ...originalAttributes, ...attributes }) })
  }

  async findUser(email: string, strategy: string): Promise<StrategyUser | undefined> {
    if (!email || !strategy) {
      throw new Error('Email and Strategy are mandatory')
    }

    return this.database
      .knex(this._getTableName(strategy))
      .select('*')
      .where({ email, strategy })
      .limit(1)
      .first()
      .then(res => {
        return res && { ...res, attributes: this.database.knex.json.get(res.attributes) }
      })
  }

  async getAllUsers(strategy: string, paging?: Paging): Promise<StrategyUser[]> {
    let query = this.database
      .knex(this._getTableName(strategy))
      .select('*')
      .orderBy('created_at', 'asc')

    if (paging) {
      query = query.offset(paging.start).limit(paging.count)
    }

    const users = await query

    return users.map(user => ({
      ...user,
      attributes: this.database.knex.json.get(user.attributes)
    }))
  }

  async getUserCount(strategy: string): Promise<number> {
    return this.database
      .knex(this._getTableName(strategy))
      .count('* as qty')
      .first()
      .then(result => result.qty)
  }
}
