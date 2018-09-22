import { injectable } from 'inversify'
import _ from 'lodash'

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
  async navigate(args: NavigationArgs): Promise<NavigationPosition> {
    let nodeName, flowName

    if (args.destination.indexOf('##') > -1) {
      nodeName = args.previousNodeName
      flowName = args.previousFlowName
    } else if (args.destination.indexOf('#') > -1) {
      const destinationNodeName = args.destination.slice(1)
      const flow = args.flows.find(f => f.name === args.previousFlowName)
      const node = flow.nodes.find(n => n.name === destinationNodeName)
      flowName = flow.name
      nodeName = node.name
    } else {
      const flow = args.flows.find(f => f.name === args.currentFlowName)
      const node = flow.nodes.find(n => n.name === args.destination)
      nodeName = node.name
      flowName = flow.name
    }

    if (!nodeName) {
      const flow = args.flows.find(x => x.name === args.destination)
      flowName = flow.name
      if (!flowName) {
        throw new Error(`Could not find any node or flow under the name of "${args.destination}"`)
      }
      nodeName = _.get(flowName, 'startNode')
    }

    return { nodeName, flowName }
  }
}
