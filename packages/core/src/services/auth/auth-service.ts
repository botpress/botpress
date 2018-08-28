import { inject, injectable, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'

import { ExtendedKnex } from '../../database/interfaces'
import { AuthUser, Logger, TokenUser } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'

import { InvalidCredentialsError, UnauthorizedAccessError } from './errors'
import resources from './resources'
import { calculateHash, validateHash } from './util'

const AUTH_PROVIDER = 'basic'
const USERS_TABLE = 'auth_users'
const JWT_SECRET = <string>process.env.JWT_SECRET

@injectable()
export default class AuthService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Auth')
    private logger: Logger,
    @inject(TYPES.Database) private knex: ExtendedKnex
  ) {}

  getResources() {
    return resources
  }

  async findUser(where: object, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    let query = this.knex(USERS_TABLE).where(where)

    if (selectFields) {
      query = query.select(selectFields)
    }
    return query.then<Array<AuthUser>>(res => res).get(0)
  }

  findUserByUsername(username: string, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    return this.findUser({ username }, selectFields)
  }

  findUserById(id: number, selectFields?: Array<keyof AuthUser>): Promise<AuthUser | undefined> {
    return this.findUser({ id }, selectFields)
  }

  async checkUserAuth(username: string, password: string) {
    const user = await this.findUserByUsername(username, ['id', 'password'])

    if (!user || !validateHash(password, user.password)) {
      throw new InvalidCredentialsError()
    }

    return user.id
  }

  async createUser(user: Partial<AuthUser>) {
    return this.knex.insertAndRetrieve<number>(USERS_TABLE, {
      ...user,
      provider: AUTH_PROVIDER,
      remote_id: user.username,
      last_synced_at: this.knex.date.now()
    })
  }

  async updateUser(username: string, userData: Partial<AuthUser>) {
    return this.knex(USERS_TABLE)
      .where(username)
      .update({
        last_synced_at: this.knex.date.now(),
        ...userData
      })
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

  async login(username: string, password: string, ipAddress: string = ''): Promise<string> {
    const userId = await this.checkUserAuth(username, password)

    if (ipAddress) {
      await this.updateUser(username, { last_ip: ipAddress })
    }

    return this.generateUserToken(userId, 'web-login')
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

    return { userId, token: await this.generateUserToken(userId, 'web-login') }
  }

  async checkToken(token: string, audience?: string) {
    return Promise.fromCallback<TokenUser>(cb => {
      jsonwebtoken.verify(token, JWT_SECRET, { audience }, (err, user) => {
        cb(err, !err ? (user as TokenUser) : undefined)
      })
    })
  }
}
