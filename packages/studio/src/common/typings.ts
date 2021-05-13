import { BotDetails, Flow, FlowNode, IO, RolloutStrategy, StageRequestApprovers, StrategyUser } from 'botpress/sdk'
import { Request } from 'express'

export interface IDisposeOnExit {
  disposeOnExit(): void
}

export interface UniqueUser {
  email: string
  strategy: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  audience: 'internal' | 'external'
  roles: AuthRole[]
  defaultRole: string
  adminRole: string
  bots: string[]
  pipeline: Pipeline
  rolloutStrategy: RolloutStrategy
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
  tokenVersion: number
  isSuperAdmin: boolean
  csrfToken?: string
  exp?: number
  iat?: number
}

export interface TokenResponse {
  jwt: string
  csrf: string
  exp: number
}

export type RequestWithUser = Request & {
  tokenUser?: TokenUser
  authUser?: StrategyUser
  workspace?: string
}

export type Pipeline = Stage[]

export type StageAction = 'promote_copy' | 'promote_move'

export interface Stage {
  id: string
  label: string
  action: StageAction
  reviewers: StageRequestApprovers[]
  minimumApprovals: number
  reviewSequence: 'serial' | 'parallel'
}

export interface FlowMutex {
  lastModifiedBy: string
  lastModifiedAt: Date
  remainingSeconds?: number // backend calculate this because all clients time might be wrong
}

export type FlowView = Flow & {
  nodes: NodeView[]
  links: NodeLinkView[]
  currentMutex?: FlowMutex
}

export interface NodeLinkView {
  source: string
  target: string
  points: FlowPoint[]
}

export interface FlowPoint {
  x: number
  y: number
}

export type NodeView = FlowNode & FlowPoint

export interface LibraryElement {
  contentId: string
  type: 'say_something' | 'execute'
  preview: string
  path: string
}

export interface ActionServer {
  id: string
  baseUrl: string
}

export type ActionScope = 'bot' | 'global'

export interface ActionDefinition {
  name: string
  category: string
  description: string
  author: string
  params: ActionParameterDefinition[]
}

export type LocalActionDefinition = ActionDefinition & {
  title: string
  scope: ActionScope
  legacy: boolean
  hidden: boolean
}

export interface ActionParameterDefinition {
  name: string
  description: string
  required: boolean
  type: string
  default: any
}

export type ActionServerWithActions = ActionServer & {
  actions: ActionDefinition[] | undefined
}
