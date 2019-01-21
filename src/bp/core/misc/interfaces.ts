import { Request } from 'express'

import { BotpressConfig } from '../config/botpress.config'

export interface IDisposeOnExit {
  disposeOnExit(): void
}

export interface IInitializeFromConfig {
  initializeFromConfig(config: BotpressConfig): void
}

export interface Workspace {
  name: string
  userSeq: number
  users: AuthUser[]
  roles: AuthRole[]
  bots: string[]
}

export interface AuthConfig {
  strategy: string
  isFirstTimeUse: boolean
  authEndpoint: string
}

export type BasicAuthUser = Partial<AuthUser> & {
  email: string
  password: string
  salt: string
}

export type ExternalAuthUser = Partial<AuthUser> & {
  email: string
  provider: string
}

export interface AuthUser {
  email: string
  password?: string
  salt?: string
  role?: string
  root_admin?: boolean
  firstname?: string
  lastname?: string
  fullName?: string
  picture?: string
  company?: string
  last_ip?: string
  location?: string
  provider?: string
  last_logon?: Date
  created_on?: Date
  password_expired?: boolean
}

export interface AuthRule {
  res: string
  op: string
}

export interface AuthRole {
  id: string
  name: string
  description: string
  rules: Array<AuthRule>
}

export interface TokenUser {
  id: number
}

export type RequestWithUser = Request & {
  user?: TokenUser
  authUser?: AuthUser
}

export interface Bot {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  version?: string
  author?: string
  license?: string
}
