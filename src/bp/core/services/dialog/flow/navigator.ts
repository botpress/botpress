import { IO, Logger } from 'botpress/sdk'
import chalk from 'chalk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { isRegExp } from 'util'

import { TYPES } from '../../../types'

export type NavigationArgs = {
  previousFlowName: string
  previousNodeName: string
  currentNodeName: string
  currentFlowName: string
  flows: any[]
  destination: string
}

export type NavigationPosition = {
  nodeName: string
  flowName: string
}

@injectable()
export class FlowNavigator {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Navigator')
    private logger: Logger
  ) {}
  async navigate(args: NavigationArgs): Promise<NavigationPosition> {
    let nodeName, flowName

    if (args.destination.indexOf('##') > -1) {
      // Transition to the starting node of the previous flow
      flowName = args.previousFlowName
      const findFlow = args.flows.find(f => f.name === flowName)
      nodeName = findFlow.startNode
    } else if (args.destination.indexOf('#') > -1) {
      // Return to calling node
      const destinationNodeName = args.destination.slice(1)
      if (!destinationNodeName) {
        nodeName = args.previousNodeName
        flowName = args.previousFlowName
        if (!nodeName) {
          const defaultFlow = args.flows.find(f => f.name === 'main.flow.json')
          nodeName = defaultFlow.startNode
          flowName = defaultFlow.name
        }
      } else {
        // Transition to a specific node in the previous flow
        const flow = args.flows.find(f => f.name === args.previousFlowName)
        const node = flow.nodes.find(n => n.name === destinationNodeName)
        flowName = flow.name
        nodeName = node.name
      }
    } else if (args.destination.includes('.json')) {
      // Transition to subflow
      const flow = args.flows.find(f => f.name === args.destination)
      nodeName = _.get(flow, 'startNode')
      flowName = flow.name
    } else {
      const currentFlow = args.flows.find(f => f.name === args.currentFlowName)
      const destinationNode = currentFlow.nodes.find(n => n.name === args.destination)
      if (destinationNode.flow) {
        // Subflow
        const destinationFlow = args.flows.find(f => f.name === destinationNode.flow)
        nodeName = destinationFlow.startNode
        flowName = destinationFlow.name
      } else {
        // Transition to a specific node in the current flow
        const flow = args.flows.find(f => f.name === args.currentFlowName)
        const node = flow.nodes.find(n => n.name === args.destination)
        nodeName = node.name
        flowName = flow.name
      }
    }

    if (!nodeName || !flowName) {
      throw new Error(`Could not find any node or flow under the name of "${args.destination}"`)
    }

    return { nodeName, flowName }
  }
}
