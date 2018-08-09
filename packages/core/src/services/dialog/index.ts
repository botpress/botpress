/**
 * @property {string} timeoutNode - Name of the node to forward to when this flow times out
 */
export type Flow = {
  name: string
  location: string
  version: string
  startNode: string
  skillData: any
  nodes: FlowNode[]
  catchAll: NodeActions
  timeoutNode?: string
  type?: string
  timeout?: { name: string; flow: string; node: string }[]
}

/**
 * @property {string} timeoutNode - Name of the node to forward to when this node times out
 */
export type FlowNode = {
  id: string
  name: string
  type: any
  timeoutNode: string
  flow: string
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
