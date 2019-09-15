import { Logger } from 'botpress/sdk'
import { AuthStrategy, AuthStrategyBasic } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { StrategyUserTable } from 'core/database/tables/server-wide/strategy_users'
import { StrategyUser, StrategyUsersRepository } from 'core/repositories/strategy_users'
import { inject, injectable, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'

import { AuthStrategyConfig, TokenUser } from '../../../common/typings'
import { Resource } from '../../misc/resources'
import { TYPES } from '../../types'
import { KeyValueStore } from '../kvs'

import StrategyBasic from './basic'
import { generateUserToken } from './util'

export const TOKEN_AUDIENCE = 'collaborators'
export const CHAT_USERS_AUDIENCE = 'chat_users'
export const WORKSPACE_HEADER = 'x-bp-workspace'
export const EXTERNAL_AUTH_HEADER = 'x-bp-externalauth'
export const SERVER_USER = 'server::modules'

@injectable()
export default class AuthService {
  public strategyBasic!: StrategyBasic

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Auth')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.StrategyUsersRepository) private users: StrategyUsersRepository,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore
  ) {}

  async initialize() {
    const config = await this.configProvider.getBotpressConfig()
    const strategyTable = new StrategyUserTable()

    return Promise.map(Object.keys(config.authStrategies), async strategy => {
      const created = await strategyTable.createStrategyTable(this.database.knex, `strategy_${strategy}`)
      if (created) {
        this.logger.info(`Created table for strategy ${strategy}`)
      }
    })
  }

  async isFirstUser() {
    return (await this.getAllUsers()).length === 0
  }

  async getAllUsers() {
    return _.flatten(
      await Promise.mapSeries(this.getAllStrategies(), strategy =>
        Promise.mapSeries(this.users.getAllUsers(strategy.id), user => {
          return { email: user.email, strategy: user.strategy }
        })
      )
    )
  }

  async getCollaboratorsConfig() {
    const config = await this.configProvider.getBotpressConfig()
    if (!config.pro.collaboratorsAuthStrategies || !config.pro.collaboratorsAuthStrategies.length) {
      throw new Error(`There must be at least one global strategy configured.`)
    }

    const strategies = await Promise.mapSeries(config.pro.collaboratorsAuthStrategies, async strategyName => {
      const strategy = (await this.getStrategy(strategyName)) as AuthStrategy
      return strategy && this._getStrategyConfig(strategy, strategyName)
    })

    return { strategies, isFirstUser: await this.isFirstUser() }
  }

  async generateSecureToken(email: string, strategy: string) {
    const config = await this.configProvider.getBotpressConfig()
    const isGlobalStrategy = config.pro.collaboratorsAuthStrategies.includes(strategy)

    const duration = config.jwtToken && config.jwtToken.duration
    const audience = isGlobalStrategy ? TOKEN_AUDIENCE : CHAT_USERS_AUDIENCE

    const isSuperAdmin =
      audience === TOKEN_AUDIENCE && !!config.superAdmins.find(x => x.strategy === strategy && x.email === email)

    return generateUserToken(email, strategy, isSuperAdmin, duration, audience)
  }

  async generateChatUserToken(email: string, strategy: string, channel: string, target: string) {
    const config = await this.configProvider.getBotpressConfig()
    const duration = config.jwtToken && config.jwtToken.duration

    const key = `${channel}::${target}`
    await this.kvs.setStorageWithExpiry('', key, { email, strategy }, duration)

    return generateUserToken(email, strategy, false, duration, CHAT_USERS_AUDIENCE)
  }

  async findUser(email: string, strategy: string): Promise<StrategyUser | undefined> {
    return this.users.findUser(email, strategy) as Promise<StrategyUser>
  }

  async createUser(user: Partial<StrategyUser>, strategy: string): Promise<StrategyUser | string> {
    if (!user.email || !strategy) {
      throw new Error('Email and strategy are required.')
    }

    if (await this.isFirstUser()) {
      return this._createFirstUser(user, strategy)
    }

    const createdUser = await this.users.createUser({
      email: user.email,
      strategy,
      attributes: user.attributes || {}
    })

    if (_.get(await this.getStrategy(strategy), 'type') === 'basic') {
      return this.strategyBasic.resetPassword(user.email, strategy)
    }

    return createdUser.result
  }

  async resetPassword(email: string, strategy: string): Promise<string> {
    return this.strategyBasic.resetPassword(email, strategy)
  }

  async updateUser(email: string, strategy: string, userFields: any): Promise<void> {
    return this.users.updateUser(email, strategy, userFields)
  }

  async updateAttributes(email: string, strategy: string, newAttributes: any): Promise<void> {
    return this.users.updateAttributes(email, strategy, newAttributes)
  }

  async deleteUser(email: string, strategy: string) {
    return this.users.deleteUser(email, strategy)
  }

  async checkToken(token: string, audience?: string): Promise<TokenUser> {
    return Promise.fromCallback<TokenUser>(cb => {
      jsonwebtoken.verify(token, process.APP_SECRET, { audience }, (err, user) => {
        cb(err, !err ? (user as TokenUser) : undefined)
      })
    })
  }

  async getAllStrategies(): Promise<AuthStrategy[]> {
    const config = await this.configProvider.getBotpressConfig()
    if (!config.authStrategies) {
      return []
    }

    return Object.keys(config.authStrategies).map(x => {
      return { id: x, ...config.authStrategies[x] }
    })
  }

  async getStrategy(strategyId: string): Promise<AuthStrategy> {
    const config = await this.configProvider.getBotpressConfig()
    return config.authStrategies[strategyId]
  }

  async refreshToken(tokenUser: TokenUser): Promise<string> {
    return this.generateSecureToken(tokenUser.email, tokenUser.strategy)
  }

  async getResources(): Promise<Resource[]> {
    if (process.IS_PRO_ENABLED) {
      const resources = require('pro/services/admin/pro-resources')
      return resources.PRO_RESOURCES
    }
    return []
  }

  private async _createFirstUser(user: Partial<StrategyUser>, strategy: string): Promise<StrategyUser> {
    if (!(await this.isFirstUser())) {
      throw new Error(`Only the first user can be created from this method.`)
    }

    const createdUser = await this.users.createUser({
      email: user.email!,
      strategy,
      password: user.password,
      salt: user.salt,
      attributes: user.attributes || {}
    })

    await this.configProvider.mergeBotpressConfig({ superAdmins: [{ email: user.email, strategy }] })
    return createdUser.result
  }

  private _getStrategyConfig(strategy: AuthStrategy, id: string): AuthStrategyConfig {
    const config: AuthStrategyConfig = {
      strategyType: strategy.type,
      strategyId: id
    }

    if (strategy.type !== 'saml') {
      config.loginUrl = `/login/${strategy.type}/${id}`
      config.registerUrl = `/register/${strategy.type}/${id}`
    }

    return config
  }
}
