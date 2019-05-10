import { Logger } from 'botpress/sdk'
import { AuthStrategy, BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { Statistics } from 'core/stats'
import { inject, injectable, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import nanoid from 'nanoid'
import { charsets, PasswordPolicy } from 'password-sheriff'

import { AuthUser, BasicAuthUser, CreatedUser, ExternalAuthUser, TokenUser } from '../../misc/interfaces'
import { Resource } from '../../misc/resources'
import { SERVER_USER } from '../../server'
import { TYPES } from '../../types'
import { WorkspaceService } from '../workspace-service'

import { InvalidCredentialsError, LockedOutError, PasswordExpiredError, WeakPasswordError } from './errors'
import { generateUserToken, isSuperAdmin, saltHashPassword, validateHash } from './util'

export const TOKEN_AUDIENCE = 'web-login'

const debug = DEBUG('audit:users')

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Auth')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Statistics) private stats: Statistics,
    @inject(TYPES.WorkspaceService) private workspace: WorkspaceService
  ) {}

  async getResources(): Promise<Resource[]> {
    if (process.IS_PRO_ENABLED) {
      const resources = require('pro/services/admin/pro-resources')
      return resources.PRO_RESOURCES
    }
    return []
  }

  async findUser(where: {}, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    return this.workspace.findUser(where, selectFields) as Promise<AuthUser>
  }

  async findUserByEmail(email: string, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    return (await this.findUser({ email }, selectFields)) as AuthUser
  }

  async checkUserAuth(email: string, password: string, newPassword?: string, ipAddress: string = '') {
    if (email === SERVER_USER) {
      debug('user tried to login with server user %o', { email, ipAddress })
      throw new InvalidCredentialsError()
    }

    const user = await this.findUserByEmail(email || '', [
      'email',
      'password',
      'salt',
      'password_expired',
      'password_expiry_date',
      'unsuccessful_logins',
      'locked_out',
      'last_login_attempt'
    ])

    if (!user) {
      debug('login failed; user does not exist %o', { email, ipAddress })
      throw new InvalidCredentialsError()
    }

    if (!validateHash(password || '', user.password!, user.salt!)) {
      debug('login failed; wrong password %o', { email, ipAddress })
      this.stats.track('auth', 'login', 'fail')

      await this._incrementWrongPassword(user)
      throw new InvalidCredentialsError()
    }

    if (user.locked_out) {
      const config = await this.configProvider.getBotpressConfig()
      const lockoutDuration = _.get(config, 'pro.auth.options.lockoutDuration')

      const lockExpired = lockoutDuration && moment().isAfter(moment(user.last_login_attempt).add(ms(lockoutDuration)))
      if (!lockoutDuration || !lockExpired) {
        debug('login failed; user locked out %o', { email, ipAddress })
        throw new LockedOutError()
      }
    }

    const isDateExpired = user.password_expiry_date && moment().isAfter(user.password_expiry_date)
    if ((user.password_expired || isDateExpired) && !newPassword) {
      throw new PasswordExpiredError()
    }

    return user.email
  }

  async createBasicUser(user: Partial<BasicAuthUser>): Promise<CreatedUser> {
    const newUser = {
      ...user
    } as BasicAuthUser

    const createdUser = await this.workspace.createUser(newUser)
    debug('created basic user', { user: createdUser })

    return {
      password: user.password ? user.password : await this.resetPassword(user.email!),
      user: createdUser
    }
  }

  async createExternalUser(user: Partial<ExternalAuthUser>, provider: AuthStrategy): Promise<CreatedUser> {
    const newUser = {
      ...user,
      provider
    } as ExternalAuthUser

    const result = {
      user: await this.workspace.createUser(newUser)
    }

    debug('created external user', { user, provider })

    return result
  }

  async createUser(user: Partial<BasicAuthUser> | Partial<ExternalAuthUser>): Promise<CreatedUser> {
    const config = await this.configProvider.getBotpressConfig()
    const strategy = _.get(config, 'pro.auth.strategy', 'basic')

    this.stats.track('user', 'create', strategy)

    if (strategy === 'basic') {
      return this.createBasicUser(user)
    } else {
      return this.createExternalUser(user, strategy)
    }
  }

  async updateUser(email: string, userData: Partial<AuthUser>, updateLastLogon?: boolean) {
    const more = updateLastLogon ? { last_logon: new Date() } : {}
    const result = await this.workspace.updateUser(email, { ...userData, ...more })
    debug('updated user %o', { email, attributes: userData })
    return result
  }

  async resetPassword(email: string) {
    const password = nanoid(15)
    const { hash, salt } = saltHashPassword(password)

    await this.workspace.updateUser(email, {
      password: hash,
      salt,
      password_expired: true
    })

    debug('password reset %o', { email })

    return password
  }

  async checkToken(token: string, audience?: string) {
    return Promise.fromCallback<TokenUser>(cb => {
      jsonwebtoken.verify(token, process.APP_SECRET, { audience }, (err, user) => {
        cb(err, !err ? (user as TokenUser) : undefined)
      })
    })
  }

  async refreshToken(tokenUser: TokenUser): Promise<string> {
    const config = await this.configProvider.getBotpressConfig()
    const duration = config.jwtToken && config.jwtToken.duration
    return generateUserToken(tokenUser.email, tokenUser.isSuperAdmin, duration, TOKEN_AUDIENCE)
  }

  async register(email: string, password: string, ipAddress: string = ''): Promise<string> {
    this.stats.track('auth', 'register', 'success')

    const pw = saltHashPassword(password)
    await this.createUser({
      email,
      password: pw.hash,
      salt: pw.salt,
      last_ip: ipAddress,
      last_logon: new Date()
    })

    debug('self register', { email, ipAddress })

    const config = await this.configProvider.getBotpressConfig()
    const duration = config.jwtToken && config.jwtToken.duration
    return generateUserToken(email, isSuperAdmin(email, config), duration, TOKEN_AUDIENCE)
  }

  async login(email: string, password: string, newPassword?: string, ipAddress: string = ''): Promise<string> {
    await this.checkUserAuth(email, password, newPassword, ipAddress)
    const config = await this.configProvider.getBotpressConfig()
    this.stats.track('auth', 'login', 'success')

    if (newPassword) {
      this._validatePassword(newPassword, config)

      const hash = saltHashPassword(newPassword)
      await this.updateUser(email, {
        password: hash.hash,
        salt: hash.salt,
        password_expired: false,
        ...this._addPasswordExpiry(config)
      })
    }

    debug('login', { email, ipAddress })

    await this.updateUser(
      email,
      {
        last_ip: ipAddress,
        unsuccessful_logins: 0,
        last_login_attempt: undefined,
        locked_out: false
      },
      true
    )

    const duration = config.jwtToken && config.jwtToken.duration
    return generateUserToken(email, isSuperAdmin(email, config), duration, TOKEN_AUDIENCE)
  }

  private _validatePassword(password: string, config: BotpressConfig) {
    const authOptions = _.get(config, 'pro.auth.options')
    if (!authOptions) {
      return
    }

    const rules: any = {}
    if (authOptions.passwordMinLength) {
      rules.length = { minLength: authOptions.passwordMinLength }
    }

    if (authOptions.requireComplexPassword) {
      rules.containsAtLeast = {
        atLeast: 3,
        expressions: [charsets.lowerCase, charsets.upperCase, charsets.numbers, charsets.specialCharacters]
      }
    }

    try {
      const policyChecker = new PasswordPolicy(rules)
      policyChecker.assert(password)
    } catch (err) {
      throw new WeakPasswordError()
    }
  }

  private _addPasswordExpiry(config: BotpressConfig) {
    const passwordExpiryDelay = _.get(config, 'pro.auth.options.passwordExpiryDelay')
    if (!passwordExpiryDelay) {
      return {}
    }

    return {
      password_expiry_date: moment()
        .add(ms(passwordExpiryDelay))
        .toDate()
    }
  }

  private async _incrementWrongPassword(user: AuthUser) {
    const config = await this.configProvider.getBotpressConfig()
    const maxLoginAttempt = _.get(config, 'pro.auth.options.maxLoginAttempt')
    const invalidLoginCount = (user.unsuccessful_logins || 0) + 1

    await this.workspace.updateUser(user.email, {
      unsuccessful_logins: invalidLoginCount,
      last_login_attempt: new Date(),
      ...(maxLoginAttempt && invalidLoginCount > maxLoginAttempt && { locked_out: true })
    })
  }
}
