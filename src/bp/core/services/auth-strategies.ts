import { AuthStrategyType } from 'core/config/botpress.config'
import { StrategyUser } from 'core/repositories/strategy_users'
import { Router } from 'express'
import { injectable } from 'inversify'

export interface AuthStrategies {
  setup(router: Router, strategyTypes: AuthStrategyType[])
  getAndUpsertUser(authUser: Partial<StrategyUser>, allowSelfSignup: boolean): Promise<StrategyUser>
  mapFields(userProfile: any, any: any)
  createTokenForUser(email: string, strategy: string): Promise<string>
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

  createTokenForUser(email: string): Promise<string> {
    throw new Error('Not implemented')
  }
}
