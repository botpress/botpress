import { inject, injectable, postConstruct, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'

import Knex from 'knex'
import Database from '../../database'
import { AuthUser, TokenUser } from '../../misc/interfaces'
import { TYPES } from '../../types'

import { InvalidCredentialsError } from './errors'
import resources from './resources'
import { calculateHash, validateHash } from './util'
import { Logging, KnexExtension } from '../../../common'
import { Resource } from '../../misc/auth'

const USERS_TABLE = 'auth_users'
const JWT_SECRET = <string>process.env.JWT_SECRET
export const TOKEN_AUDIENCE = 'web-login'

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Auth')
    private logger: Logging.Logger,
    @inject(TYPES.Database) private db: Database
  ) {}

  @postConstruct()
  ensureHasSecret() {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET has not been set!')
    }
  }

  get knex(): Knex & KnexExtension {
    return this.db.knex!
  }

  getResources(): Resource[] {
    return resources
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

  async checkUserAuth(username: string, password: string) {
    const user = await this.findUserByUsername(username || '', ['id', 'password'])

    if (!user || !validateHash(password || '', user.password)) {
      throw new InvalidCredentialsError()
    }

    return user.id
  }

  async createUser(user: Partial<AuthUser>) {
    return this.knex.insertAndRetrieve<number>(USERS_TABLE, user)
  }

  async updateUser(username: string, userData: Partial<AuthUser>) {
    return this.knex(USERS_TABLE)
      .where({ username })
      .update(userData)
      .then()
  }

  async generateUserToken(userId: number, audience?: string) {
    return Promise.fromCallback<string>(cb => {
      jsonwebtoken.sign(
        {
          id: userId
        },
        JWT_SECRET,
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
      jsonwebtoken.verify(token, JWT_SECRET, { audience }, (err, user) => {
        cb(err, !err ? (user as TokenUser) : undefined)
      })
    })
  }

  async login(username: string, password: string, ipAddress: string = ''): Promise<string> {
    const userId = await this.checkUserAuth(username, password)

    if (ipAddress) {
      await this.updateUser(username, { last_ip: ipAddress })
    }

    return this.generateUserToken(userId, TOKEN_AUDIENCE)
  }

  async register(
    username: string,
    password: string,
    ipAddress: string = ''
  ): Promise<{ userId: number; token: string }> {
    if (await this.findUserByUsername(username)) {
      throw new InvalidCredentialsError(`Username ${username} is already taken`)
    }

    const userId = await this.createUser({
      username,
      password: calculateHash(password),
      last_ip: ipAddress
    })

    return { userId, token: await this.generateUserToken(userId, TOKEN_AUDIENCE) }
  }
}
