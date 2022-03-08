import { Logger, StrategyUser } from 'botpress/sdk'
import { JWT_COOKIE_NAME } from 'common/auth'
import {
  AuthPayload,
  AuthStrategyConfig,
  ChatUserAuth,
  TokenUser,
  TokenResponse,
  RequestWithUser,
  LogoutCallback
} from 'common/typings'
import { TYPES } from 'core/app/types'
import { AuthStrategy, ConfigProvider } from 'core/config'
import Database from 'core/database'
import { SessionIdFactory } from 'core/dialog/sessions'
import { JobService } from 'core/distributed'
import { EventEngine, Event } from 'core/events'
import { KeyValueStore } from 'core/kvs'
import { ModuleLoader } from 'core/modules'
import { BadRequestError } from 'core/routers'
import { StrategyBasic, generateUserToken, getMessageSignature } from 'core/security'
import { StrategyUsersRepository, WorkspaceService } from 'core/users'
import { StrategyUserTable } from 'core/users/tables'
import { Response } from 'express'
import { inject, injectable, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import { studioActions } from 'orchestrator'

export const TOKEN_AUDIENCE = 'collaborators'
export const CHAT_USERS_AUDIENCE = 'chat_users'
export const WORKSPACE_HEADER = 'x-bp-workspace'
export const EXTERNAL_AUTH_HEADER = 'x-bp-externalauth'
export const SERVER_USER = 'server::modules'
const DEFAULT_CHAT_USER_AUTH_DURATION = '24h'

const getUserKey = (email: string, strategy: string) => `${email}_${strategy}`

@injectable()
export class AuthService {
  public strategyBasic!: StrategyBasic
  private tokenVersions: Dic<number> = {}
  private broadcastTokenChange: Function = this.local__tokenVersionChange
  public jobService!: JobService
  private logoutCallbacks: { [strategy: string]: LogoutCallback } = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Auth')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.StrategyUsersRepository) private users: StrategyUsersRepository,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService
  ) {}

  async initialize() {
    this.broadcastTokenChange = await this.jobService.broadcast<void>(this.local__tokenVersionChange.bind(this))

    const config = await this.configProvider.getBotpressConfig()
    const strategyTable = new StrategyUserTable()

    return Promise.map(Object.keys(config.authStrategies), async strategy => {
      const created = await strategyTable.createStrategyTable(this.database.knex, `strategy_${strategy}`)
      if (created) {
        this.logger.info(`Created table for strategy ${strategy}`)
      }
    })
  }

  private async local__tokenVersionChange(email: string, strategy: string, tokenVersion: number): Promise<void> {
    this.tokenVersions[getUserKey(email, strategy)] = tokenVersion
    await studioActions.updateTokenVersion(email, strategy, tokenVersion)
  }

  async isFirstUser() {
    return (await this.getAllUsers()).length === 0
  }

  async getAllUsers() {
    return _.flatten(
      await Promise.mapSeries(this.getAllStrategies(), strategy =>
        Promise.mapSeries(this.users.getAllUsers(strategy.id!), user => {
          return { email: user.email, strategy: user.strategy }
        })
      )
    )
  }

  async getCollaboratorsConfig() {
    const config = await this.configProvider.getBotpressConfig()
    if (!config.pro.collaboratorsAuthStrategies || !config.pro.collaboratorsAuthStrategies.length) {
      throw new Error('There must be at least one global strategy configured.')
    }

    const strategies = await Promise.mapSeries(_.uniq(config.pro.collaboratorsAuthStrategies), async strategyName => {
      const strategy = (await this.getStrategy(strategyName)) as AuthStrategy
      return strategy && this._getStrategyConfig(strategy, strategyName)
    })
    return { strategies: strategies.filter(Boolean), isFirstUser: await this.isFirstUser() }
  }

  async generateSecureToken(email: string, strategy: string) {
    const config = await this.configProvider.getBotpressConfig()
    const isGlobalStrategy = config.pro.collaboratorsAuthStrategies.includes(strategy)
    const user = await this.users.findUser(email, strategy)

    const duration = config.jwtToken && config.jwtToken.duration
    const audience = isGlobalStrategy ? TOKEN_AUDIENCE : CHAT_USERS_AUDIENCE

    const isSuperAdmin =
      audience === TOKEN_AUDIENCE &&
      !!config.superAdmins.find(x => x.strategy === strategy && x.email.toLowerCase() === email.toLowerCase())

    return generateUserToken({
      email,
      strategy,
      tokenVersion: user!.tokenVersion!,
      isSuperAdmin,
      expiresIn: duration,
      audience
    })
  }

  async generateChatUserToken(email: string, strategy: string, channel: string, target: string) {
    const config = await this.configProvider.getBotpressConfig()
    const duration = config.jwtToken && config.jwtToken.duration

    const key = `${channel}::${target}`
    await this.kvs.global().set(key, { email, strategy }, undefined, duration)

    return generateUserToken({
      email,
      strategy,
      tokenVersion: 1,
      isSuperAdmin: false,
      expiresIn: duration,
      audience: CHAT_USERS_AUDIENCE
    })
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
      tokenVersion: 1,
      attributes: { ...(user.attributes || {}), created_at: new Date() }
    })
    const strategyUser = createdUser.result

    if (_.get(await this.getStrategy(strategy), 'type') === 'basic') {
      return this.strategyBasic.resetPassword(user.email, strategy)
    }

    return strategyUser
  }

  async resetPassword(email: string, strategy: string): Promise<string> {
    await this.incrementTokenVersion(email, strategy)
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

  async isTokenVersionValid({ email, strategy, tokenVersion }: TokenUser) {
    if (email === SERVER_USER) {
      return true
    }

    const currentVersion = this.tokenVersions[getUserKey(email, strategy)]
    if (currentVersion !== undefined) {
      return currentVersion === tokenVersion
    }

    const user = await this.users.findUser(email, strategy)
    if (user) {
      this.tokenVersions[getUserKey(email, strategy)] = user.tokenVersion!
      return user.tokenVersion === tokenVersion
    }
  }

  async checkToken(jwtToken: string, csrfToken: string, audience?: string): Promise<TokenUser> {
    return Promise.fromCallback<TokenUser>(cb => {
      jsonwebtoken.verify(jwtToken, process.APP_SECRET, { audience }, async (err, user) => {
        const tokenUser = user as TokenUser

        if (!err && (await this.isTokenVersionValid(tokenUser))) {
          if (process.USE_JWT_COOKIES && tokenUser.csrfToken !== csrfToken) {
            cb('Invalid CSRF Token')
          } else {
            cb(undefined, tokenUser)
          }
        }
        cb(err, undefined)
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

  async refreshToken(tokenUser: TokenUser): Promise<TokenResponse> {
    return this.generateSecureToken(tokenUser.email, tokenUser.strategy)
  }

  async incrementTokenVersion(email: string, strategy: string) {
    const currentUser = await this.users.findUser(email, strategy)
    if (currentUser) {
      const newVersion = currentUser.tokenVersion! + 1

      await this.users.updateUser(email, strategy, { tokenVersion: newVersion })
      await this.broadcastTokenChange(email, strategy, newVersion)
    }
  }

  async invalidateToken({ email, strategy, tokenVersion }: TokenUser): Promise<boolean> {
    const currentUser = await this.users.findUser(email, strategy)

    if (currentUser?.tokenVersion === tokenVersion) {
      await this.incrementTokenVersion(email, strategy)
      return true
    }

    return false
  }

  private async _createFirstUser(user: Partial<StrategyUser>, strategy: string): Promise<StrategyUser> {
    if (!(await this.isFirstUser())) {
      throw new Error('Only the first user can be created from this method.')
    }

    const createdUser = await this.users.createUser({
      email: user.email!,
      strategy,
      tokenVersion: 1,
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
      strategyId: id,
      label: strategy.label,
      hidden: strategy.hidden
    }

    if (strategy.type !== 'saml') {
      config.loginUrl = `/login/${strategy.type}/${id}`
      config.registerUrl = `/register/${strategy.type}/${id}`
    }

    return config
  }

  private async _getChatAuthExpiry(channel: string, botId: string): Promise<Date | undefined> {
    let authDuration: string | undefined

    try {
      const config = await this.configProvider.getBotConfig(botId)
      const channelConfig = config.messaging?.channels?.[channel]

      if (channelConfig) {
        authDuration = channelConfig.chatUserAuthDuration
      } else {
        const config = await this.moduleLoader.configReader.getForBot(`channel-${channel}`, botId)
        authDuration = config?.chatUserAuthDuration
      }
    } catch (err) {
      this.logger
        .attachError(err)
        .error(`Could not get auth duration for channel ${channel} and bot ${botId}. Using default value`)
    }

    return moment()
      .add(ms(authDuration ?? DEFAULT_CHAT_USER_AUTH_DURATION))
      .toDate()
  }

  public async authChatUser(chatUserAuth: ChatUserAuth, identity: TokenUser): Promise<void> {
    const { botId, sessionId, signature } = chatUserAuth
    const { email, strategy, isSuperAdmin } = identity
    const { channel, target, threadId } = SessionIdFactory.extractDestinationFromId(sessionId)

    const sendEvent = async (payload: AuthPayload) => {
      const incomingEvent = Event({
        direction: 'incoming',
        type: 'auth',
        botId,
        payload: { identity, ...payload },
        channel,
        target,
        threadId
      })

      await this.eventEngine.sendEvent(incomingEvent)
    }

    if (signature !== (await getMessageSignature(JSON.stringify({ botId, sessionId })))) {
      await sendEvent({ authenticatedUntil: undefined })
      throw new BadRequestError('Payload signature is invalid')
    }

    const workspaceId = await this.workspaceService.getBotWorkspaceId(botId)
    const isMember = !!(await this.workspaceService.findUser(email, strategy, workspaceId))
    const authenticatedUntil = await this._getChatAuthExpiry(channel, botId)
    const { rolloutStrategy } = await this.workspaceService.getWorkspaceRollout(workspaceId)

    if (rolloutStrategy.includes('anonymous')) {
      throw new BadRequestError('Authentication not required for anonymous strategies')
    }

    if (rolloutStrategy === 'authenticated-invite' && !isMember && !isSuperAdmin) {
      return sendEvent({ authenticatedUntil, inviteRequired: true })
    }

    if (rolloutStrategy === 'authenticated' && !isMember && !isSuperAdmin) {
      await this.workspaceService.addUserToWorkspace(email, strategy, workspaceId, { asChatUser: true })
      return sendEvent({ authenticatedUntil, isAuthorized: true })
    }

    return sendEvent({ authenticatedUntil, isAuthorized: isMember || isSuperAdmin })
  }

  public async setJwtCookieResponse(token: TokenResponse, res: Response): Promise<boolean> {
    if (!process.USE_JWT_COOKIES) {
      return false
    }

    const config = await this.configProvider.getBotpressConfig()
    const cookieOptions = config.jwtToken.cookieOptions

    res.cookie(JWT_COOKIE_NAME, token.jwt, { maxAge: token.exp, httpOnly: true, ...cookieOptions })
    return true
  }

  public addLogoutCallback(strategy: string, callback: LogoutCallback) {
    this.logoutCallbacks[strategy] = callback
  }

  public async logout(strategy: string, req: RequestWithUser, res: Response) {
    const callback = this.logoutCallbacks[strategy]

    if (!callback) {
      return res.sendStatus(200)
    }

    return callback(strategy, req, res)
  }
}

export default AuthService
