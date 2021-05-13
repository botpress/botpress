import { Logger, StrategyUser } from 'botpress/sdk'
import { JWT_COOKIE_NAME } from 'common/auth'
import { TokenUser, TokenResponse } from 'common/typings'
import { TYPES } from 'core/app/types'
import { ConfigProvider } from 'core/config'
import { StrategyUsersRepository } from 'core/users'
import { Response } from 'express'
import { inject, injectable, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'

export const TOKEN_AUDIENCE = 'collaborators'
export const CHAT_USERS_AUDIENCE = 'chat_users'
export const WORKSPACE_HEADER = 'x-bp-workspace'
export const EXTERNAL_AUTH_HEADER = 'x-bp-externalauth'
export const SERVER_USER = 'server::modules'

const getUserKey = (email, strategy) => `${email}_${strategy}`

@injectable()
export class AuthService {
  private tokenVersions: Dic<number> = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Auth')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.StrategyUsersRepository) private users: StrategyUsersRepository
  ) {}

  async tokenVersionChange(email: string, strategy: string, tokenVersion: number): Promise<void> {
    this.tokenVersions[getUserKey(email, strategy)] = tokenVersion
  }

  async findUser(email: string, strategy: string): Promise<StrategyUser | undefined> {
    return this.users.findUser(email, strategy) as Promise<StrategyUser>
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

  public async setJwtCookieResponse(token: TokenResponse, res: Response): Promise<boolean> {
    if (!process.USE_JWT_COOKIES) {
      return false
    }

    const config = await this.configProvider.getBotpressConfig()
    const cookieOptions = config.jwtToken.cookieOptions

    res.cookie(JWT_COOKIE_NAME, token.jwt, { maxAge: token.exp, httpOnly: true, ...cookieOptions })
    return true
  }
}

export default AuthService
