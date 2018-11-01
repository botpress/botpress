import { Flow, FlowNode } from 'botpress/sdk'

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
