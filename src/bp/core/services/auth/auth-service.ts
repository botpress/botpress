import { Logger } from 'botpress/sdk'
import { AuthStrategy, AuthStrategyBasic } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { StrategyUserTable } from 'core/database/tables/server-wide/strategy_users'
import { StrategyUser, StrategyUsersRepository } from 'core/repositories/strategy_users'
import { WorkspaceUsersRepository } from 'core/repositories/workspace_users'
import { inject, injectable, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'

import { TokenUser } from '../../misc/interfaces'
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

export interface UniqueUser {
  email: string
  strategy: string
}

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
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore,
    @inject(TYPES.WorkspaceUsersRepository) private workspaceRepo: WorkspaceUsersRepository
  ) {}

  async initialize() {
    const config = await this.configProvider.getBotpressConfig()
    const strategies = Object.keys(config.authStrategies)
    const strategyTable = new StrategyUserTable()

    if (!config.authStrategies || !config.pro.globalAuthStrategies || !config.pro.globalAuthStrategies.length) {
      await this._setDefaultStrategy()
    }

    await Promise.mapSeries(strategies, async strategy => {
      const created = await strategyTable.createStrategyTable(this.database.knex, `strategy_${strategy}`)
      if (created) {
        this.logger.info(`Created table for strategy ${strategy}`)
      }
    })
  }

  async isFirstUser() {
    // TODO: maybe allow the first for different default strategy
    const count = await this.workspaceRepo.getUniqueCollaborators()
    return count === 0
  }

  async listStrategies() {
    const config = await this.configProvider.getBotpressConfig()
    const strategies = Object.keys(config.authStrategies).map(x => {
      const strategy = config.authStrategies[x]
      return { id: x, ...strategy, config: this._getStrategyConfig(strategy, x) }
    })

    return { list: strategies, global: config.pro.globalAuthStrategies }
  }

  async getCollaboratorsConfig() {
    const defaultStrategy = await this.getDefaultStrategy()
    const strategy = (await this.getStrategy(defaultStrategy)) as AuthStrategy

    return this._getStrategyConfig(strategy, defaultStrategy)
  }

  async setChatUserToken(token: string, { channel, target }): Promise<void> {
    const tokenData = await this.checkToken(token, TOKEN_AUDIENCE)
    const expiration = (tokenData.exp && tokenData.exp / 1000) || 0

    const key = `${channel}::${target}`
    await this.kvs.setStorageWithExpiry('', key, tokenData, expiration + '')
  }

  async generateSecureToken(email: string, strategy: string, forceChatUser?: boolean) {
    const config = await this.configProvider.getBotpressConfig()
    const isGlobalStrategy = config.pro.globalAuthStrategies.includes(strategy)

    const duration = config.jwtToken && config.jwtToken.duration
    const audience = forceChatUser || !isGlobalStrategy ? CHAT_USERS_AUDIENCE : TOKEN_AUDIENCE
    const isSuperAdmin = audience === TOKEN_AUDIENCE && config.superAdmins.includes({ strategy, email })

    return generateUserToken(email, strategy, isSuperAdmin, duration, audience)
  }

  async getAudience(strategy: string) {
    const config = await this.configProvider.getBotpressConfig()
    return config.pro.globalAuthStrategies.includes(strategy) ? TOKEN_AUDIENCE : CHAT_USERS_AUDIENCE
  }

  async getStrategy(strategyId: string, configPath?: string): Promise<AuthStrategy | Partial<AuthStrategy>> {
    const config = await this.configProvider.getBotpressConfig()
    const strategy = config.authStrategies[strategyId]

    return configPath ? _.get(strategy, configPath) : config.authStrategies[strategyId]
  }

  async findUser(email: string, strategy: string): Promise<StrategyUser | undefined> {
    return this.users.findUser(email, strategy) as Promise<StrategyUser>
  }

  async findUserAttributes(email: string, strategy: string): Promise<any | undefined> {
    const user = await this.users.findUser(email, strategy)
    return user && user.attributes
  }

  async createUser(user: Partial<StrategyUser>, strategy: string): Promise<StrategyUser | string> {
    if (!user.email) {
      throw new Error('no')
    }

    const createdUser = await this.users.createUser({
      email: user.email,
      strategy,
      attributes: user.attributes || {}
    })

    const strategyType = await this.getStrategy(strategy, 'type')
    if (strategyType === 'basic') {
      return this.strategyBasic.resetPassword(user.email, strategy)
    }

    return createdUser.result
  }

  async resetPassword(email: string, strategy: string) {
    return this.strategyBasic.resetPassword(email, strategy)
  }

  async updateUser(email: string, strategy: string, userFields: any) {
    return this.users.updateUser(email, strategy, userFields)
  }

  async updateAttributes(email: string, strategy: string, newAttributes: any) {
    return this.users.updateAttributes(email, strategy, newAttributes)
  }

  async checkToken(token: string, audience?: string) {
    return Promise.fromCallback<TokenUser>(cb => {
      jsonwebtoken.verify(token, process.APP_SECRET, { audience }, (err, user) => {
        cb(err, !err ? (user as TokenUser) : undefined)
      })
    })
  }

  async getAllStrategies() {
    const config = await this.configProvider.getBotpressConfig()
    return Object.keys(config.authStrategies).map(x => {
      const strategy = config.authStrategies[x]
      return { id: x, ...strategy }
    })
  }

  async getDefaultStrategy(): Promise<string> {
    const config = await this.configProvider.getBotpressConfig()
    if (!config.pro.globalAuthStrategies || !config.pro.globalAuthStrategies.length) {
      throw new Error(`There must be at least one default strategy configured.`)
    }

    return _.first(config.pro.globalAuthStrategies)!
  }

  async getStrategyTypes() {
    const config = await this.configProvider.getBotpressConfig()
    if (!config.authStrategies) {
      return []
    }

    return Object.keys(config.authStrategies).map(s => config.authStrategies[s].type)
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

  private async _setDefaultStrategy(): Promise<void> {
    this.logger.info(`Default strategy "default" configured in Botpress Config`)

    return this.configProvider.mergeBotpressConfig({
      pro: {
        globalAuthStrategies: ['default']
      },
      authStrategies: {
        ['default']: {
          type: 'basic',
          allowSelfSignup: false,
          options: {
            maxLoginAttempt: 0
          } as AuthStrategyBasic
        }
      }
    })
  }

  private _getStrategyConfig(strategy: AuthStrategy, id: string) {
    if (strategy.type === 'saml') {
      return {
        strategyType: strategy.type,
        strategyId: id
      }
    }

    return {
      loginUrl: `/login/${strategy.type}/${id}`,
      registerUrl: `/register/${strategy.type}/${id}`,
      strategyType: strategy.type,
      strategyId: id
    }
  }
}
