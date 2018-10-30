import { Request } from 'express'

export interface IDisposeOnExit {
  disposeOnExit(): void
}

export interface AuthUser {
  id: number
  username: string
  password: string
  salt: string
  firstname?: string
  lastname?: string
  fullName?: string
  picture?: string
  company?: string
  last_ip?: string
  email?: string
  location?: string
  last_logon?: Date
  password_expired?: boolean
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
  id: string
  name: string
  team: number
  description: string
  created_at: string
  updated_at: string
  version?: string
  author?: string
  license?: string
}
