export interface FlowProvider {
  loadAll(): Promise<FlowView[]>
  saveAll(flows: FlowView[]): Promise<void>
}

export type Flow = {
  version: string
  startNode: string
  nodes: [FlowNode]
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
  onEnter?: [string]
  onReceive?: [string]
  next?: [NodeTransition]
}

// View-related interfaces

export type FlowView = Flow & {
  nodes: [NodeView]
  links: [NodeLinkView]
}

export type NodeLinkView = {
  source: string
  target: string
  points: [{ x: number; y: number }]
}

export type NodeView = FlowNode & { position: { x: number; y: number } }
