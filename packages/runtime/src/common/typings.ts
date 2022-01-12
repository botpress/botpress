import { Flow, FlowNode, IO } from 'botpress/runtime-sdk'

import { RuntimeConfig } from '../runtime/config'

export interface IDisposeOnExit {
  disposeOnExit(): void
}

export interface IInitializeFromConfig {
  initializeFromConfig(config: RuntimeConfig): void
}

export type FlowView = Flow & {
  nodes: NodeView[]
  links: NodeLinkView[]
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

export interface OutgoingEventCommonArgs {
  event: IO.Event
  // Any other additional property
  [property: string]: any
}

export interface EventCommonArgs {
  event: IO.IncomingEvent
  user: { [attribute: string]: any }
  temp: { [property: string]: any }
  bot: { [property: string]: any }
  session: IO.CurrentSession
  // Any other additional property
  [property: string]: any
}

export interface ServerHealth {
  serverId: string
  hostname: string
  bots: { [botId: string]: BotHealth }
}

export interface BotHealth {
  status: 'healthy' | 'unhealthy' | 'disabled'
  errorCount: number
  criticalCount: number
  warningCount: number
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
