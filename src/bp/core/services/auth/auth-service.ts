import { Logger } from 'botpress/sdk'
import { KnexExtension } from 'common/knex'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import Knex from 'knex'

import Database from '../../database'
import { Resource } from '../../misc/auth'
import { AuthUser, TokenUser } from '../../misc/interfaces'
import { TYPES } from '../../types'

import { InvalidCredentialsError, PasswordExpiredError } from './errors'
import { saltHashPassword, validateHash } from './util'

const USERS_TABLE = 'auth_users'
export const TOKEN_AUDIENCE = 'web-login'

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Auth')
    private logger: Logger,
    @inject(TYPES.Database) private db: Database
  ) {}

  get knex(): Knex & KnexExtension {
    return this.db.knex!
  }

  async getResources(): Promise<Resource[]> {
    if (process.env.EDITION !== 'ce') {
      const resources = require('professional/services/admin/pro-resources')
      return resources.PRO_RESOURCES
    }
    return []
  }

  async findUser(where: {}, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    return this.knex(USERS_TABLE)
      .where(where)
      .select(selectFields || ['*'])
      .then<Array<AuthUser>>(res => res)
      .get(0)
  }

  findUserByUsername(username: string, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    return this.findUser({ username }, selectFields)
  }

  findUserById(id: number, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    return this.findUser({ id }, selectFields)
  }

  async checkUserAuth(username: string, password: string, newPassword?: string) {
    const user = await this.findUserByUsername(username || '', ['id', 'password', 'salt', 'password_expired'])

    if (!user || !validateHash(password || '', user.password, user.salt)) {
      throw new InvalidCredentialsError()
    }

    if (user.password_expired && !newPassword) {
      throw new PasswordExpiredError()
    }

    return user.id
  }

  async createUser(user: Partial<AuthUser>) {
    return this.knex.insertAndRetrieve<number>(USERS_TABLE, user)
  }

  async updateUser(username: string, userData: Partial<AuthUser>, updateLastLogon?: boolean) {
    // Shady thing because knex date is a raw and can't be assigned to a date object...
    const more = updateLastLogon ? { last_logon: this.db.knex.date.now() } : {}
    return this.knex(USERS_TABLE)
      .where({ username })
      .update({ ...userData, ...more })
      .then()
  }

  async generateUserToken(userId: number, audience?: string) {
    return Promise.fromCallback<string>(cb => {
      jsonwebtoken.sign(
        {
          id: userId
        },
        process.JWT_SECRET,
        {
          expiresIn: '6h',
          audience
        },
        cb
      )
    })
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

    if (newPassword) {
      const hash = saltHashPassword(newPassword)
      await this.updateUser(username, {
        password: hash.hash,
        salt: hash.salt,
        password_expired: false
      })
    }

    await this.updateUser(username, { last_ip: ipAddress }, true)
    return this.generateUserToken(userId, TOKEN_AUDIENCE)
  }
}
