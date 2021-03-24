import { StrategyUser } from 'botpress/sdk'
import { TokenResponse } from 'common/typings'
import { AuthStrategyType } from 'core/config'
import { Router } from 'express'
import { injectable } from 'inversify'

export interface AuthStrategies {
  setup(router: Router, strategyTypes: AuthStrategyType[])
  getAndUpsertUser(authUser: Partial<StrategyUser>, allowSelfSignup: boolean): Promise<StrategyUser>
  mapFields(userProfile: any, any: any)
  createTokenForUser(email: string, strategy: string): Promise<TokenResponse>
}

@injectable()
export class CEAuthStrategies implements AuthStrategies {
  async setup(router: Router, strategyTypes: AuthStrategyType[]) {
    throw new Error('Not implemented')
  }

  getAndUpsertUser(authUser: Partial<StrategyUser>): Promise<StrategyUser> {
    throw new Error('Not implemented')
  }

  mapFields(userProfile: any) {
    throw new Error('Not implemented')
  }

  createTokenForUser(email: string): Promise<TokenResponse> {
    throw new Error('Not implemented')
  }
}
