import { Logger } from 'botpress/sdk'
import { TokenUser } from 'common/typings'
import { TYPES } from 'core/app/types'
import { ConfigProvider } from 'core/config'
import { StrategyUsersRepository } from 'core/users'
import { inject, injectable, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'

export const TOKEN_AUDIENCE = 'collaborators'
export const WORKSPACE_HEADER = 'x-bp-workspace'
export const SERVER_USER = 'server::modules'

const getUserKey = (email, strategy) => `${email}_${strategy}`

@injectable()
export class AuthService {
  private tokenVersions: Dic<number> = {}

  constructor(@inject(TYPES.StrategyUsersRepository) private users: StrategyUsersRepository) {}

  async tokenVersionChange(email: string, strategy: string, tokenVersion: number): Promise<void> {
    this.tokenVersions[getUserKey(email, strategy)] = tokenVersion
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
}

export default AuthService
