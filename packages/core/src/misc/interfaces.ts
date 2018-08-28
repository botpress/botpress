import { Request } from 'express'

export interface Logger {
  debug(message: string, metadata?: any): void
  info(message: string, metadata?: any): void
  warn(message: string, metadata?: any): void
  error(message: string, metadata?: any): void
  error(message: string, error: Error, metadata?: any): void
}

export interface IDisposeOnExit {
  disposeOnExit(): void
}

export interface BotpressEvent {
  id?: string | number
  bot?: {
    id?: string | number
    botId?: string | number
  }
  botId?: string | number
  user?: {
    id?: string | number
    userId?: string | number
  }
  userId?: string | number
  raw?: BotpressEvent
}

export interface AuthUser {
  id: number
  username: string
  password: string
  firstname?: string
  lastname?: string
  fullName?: string
  picture?: string
  company?: string
  last_ip?: string
  email?: string
  remote_id: string
  provider: string
  location?: string
  last_synced_at: string
}

export interface AuthTeam {
  id: number
  name: string
  invite_code: string
}

export interface AuthTeamMembership {
  id: number
  user: number
  team: number
  role: string
}

export interface AuthRule {
  res: string
  op: string
}

interface AuthRoleCommon {
  id?: number
  name: string
  description: string
}

export type AuthRole = AuthRoleCommon & {
  rules: Array<AuthRule>
}

export type AuthRoleDb = AuthRoleCommon & {
  rules: string
}

export interface TokenUser {
  id: number
}

export type RequestWithUser = Request & {
  user?: TokenUser
  dbUser?: AuthUser
}

export interface Bot {
  id: number
  name?: string
  version?: string
  description?: string
  author?: string
  license?: string
  public_id: string
  created_at: string
  updated_at: string
  team: number
}
