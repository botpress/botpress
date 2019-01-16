import { Logger } from 'botpress/sdk'

import { Statistics } from 'core/stats'
import { inject, injectable, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'

import Database from '../../database'
import { AuthUser, TokenUser } from '../../misc/interfaces'
import { Resource } from '../../misc/resources'
import { TYPES } from '../../types'
import { WorkspaceService } from '../workspace'

import { InvalidCredentialsError, PasswordExpiredError } from './errors'
import { generateUserToken, saltHashPassword, validateHash } from './util'

export const TOKEN_AUDIENCE = 'web-login'

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Auth')
    private logger: Logger,
    @inject(TYPES.Database) private db: Database,
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
    return this.workspace.findUser(where, selectFields)
  }

  findUserByUsername(username: string, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    return this.findUser({ username }, selectFields)
  }

  findUserById(id: number, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    return this.findUser({ id }, selectFields)
  }

  async checkUserAuth(username: string, password: string, newPassword?: string) {
    const user = await this.findUserByUsername(username || '', ['id', 'password', 'salt', 'password_expired'])

    if (!user || !validateHash(password || '', user.password!, user.salt!)) {
      this.stats.track('auth', 'login', 'fail')
      throw new InvalidCredentialsError()
    }

    if (user.password_expired && !newPassword) {
      throw new PasswordExpiredError()
    }

    return user.id
  }
  async createUser(user: AuthUser) {
    return this.workspace.createUser(user)
  }

  async updateUser(userId: number, userData: Partial<AuthUser>, updateLastLogon?: boolean) {
    const more = updateLastLogon ? { last_logon: new Date() } : {}
    return await this.workspace.updateUser(userId, { ...userData, ...more })
  }

  async checkToken(token: string, audience?: string) {
    return Promise.fromCallback<TokenUser>(cb => {
      jsonwebtoken.verify(token, process.JWT_SECRET, { audience }, (err, user) => {
        cb(err, !err ? (user as TokenUser) : undefined)
      })
    })
  }

  async login(username: string, password: string, newPassword?: string, ipAddress: string = ''): Promise<string> {
    const userId = await this.checkUserAuth(username, password, newPassword)
    this.stats.track('auth', 'login', 'success')

    if (newPassword) {
      const hash = saltHashPassword(newPassword)
      await this.updateUser(userId, {
        password: hash.hash,
        salt: hash.salt,
        password_expired: false
      })
    }

    await this.updateUser(userId, { last_ip: ipAddress }, true)
    return generateUserToken(userId, TOKEN_AUDIENCE)
  }
}
