import { AuthUser } from 'core/misc/interfaces'
import { Router } from 'express'
import { injectable } from 'inversify'

export interface AuthStrategies {
  setup(router: Router)
  getAndUpsertUser(authUser: Partial<AuthUser>): Promise<AuthUser>
  mapFields(userProfile: any)
  createTokenForUser(email: string): Promise<string>
}

@injectable()
export class CEAuthStrategies implements AuthStrategies {
  async setup(router: Router) {
    throw new Error('Not implemented')
  }

  getAndUpsertUser(authUser: Partial<AuthUser>): Promise<AuthUser> {
    throw new Error('Not implemented')
  }

  mapFields(userProfile: any) {
    throw new Error('Not implemented')
  }

  createTokenForUser(email: string): Promise<string> {
    throw new Error('Not implemented')
  }
}
