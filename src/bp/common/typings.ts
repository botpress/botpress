import { BotDetails } from 'botpress/sdk'
import { Request } from 'express'

import { BotpressConfig } from '../core/config/botpress.config'
import { StrategyUser } from '../core/repositories/strategy_users'

export interface IDisposeOnExit {
  disposeOnExit(): void
}

export interface IInitializeFromConfig {
  initializeFromConfig(config: BotpressConfig): void
}

export interface UniqueUser {
  email: string
  strategy: string
}

export interface AuthStrategyConfig {
  strategyType: string
  strategyId: string
  loginUrl?: string
  registerUrl?: string
}

export interface Workspace {
  id: string
  name: string
  roles: AuthRole[]
  defaultRole: string
  adminRole: string
  bots: string[]
  pipeline: Pipeline
  authStrategy?: string
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
  email: string
  strategy: string
  isSuperAdmin: boolean
  exp?: number
}

export type RequestWithUser = Request & {
  tokenUser?: TokenUser
  authUser?: StrategyUser
  workspace?: string
}

export interface Bot {
  id: string
  name: string
  description: string
  category?: string
  disabled?: boolean
  private?: boolean
  details?: BotDetails
  version?: string
  author?: string
  license?: string
  created_at: string
  updated_at: string
}

export type Pipeline = Stage[]

export type StageAction = 'promote_copy' | 'promote_move'

export interface Stage {
  id: string
  label: string
  action: StageAction
}
