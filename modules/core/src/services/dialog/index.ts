export interface FlowProvider {
  loadAll(botId: string): Promise<FlowView[]>
  saveAll(flows: FlowView[]): Promise<void>
}

export type Flow = {
  version: string
  startNode: string
  skillData: any
  nodes: FlowNode[]
  catchAll: NodeActions
}

export type FlowNode = {
  id: string
  name: string
} & NodeActions

export type NodeTransition = {
  condition: string
  node: string
}

export type NodeActions = {
  onEnter?: string[]
  onReceive?: string[]
  next?: NodeTransition[]
}

// View-related interfaces

export type FlowView = Flow & {
  nodes: NodeView[]
  links: NodeLinkView[]
}

export type NodeLinkView = {
  source: string
  target: string
  points: { x: number; y: number }[]
}

export type NodeView = FlowNode & { x: number; y: number }
