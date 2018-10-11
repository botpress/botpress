import { Flow, FlowGenerationResult, FlowNode, NodeActionType, SkillFlow } from 'botpress/sdk'
import { injectable } from 'inversify'
import _ from 'lodash'
import shortid from 'shortid'

@injectable()
export class SkillService {
  constructor() {}

  public finalizeFlow(partialFlow: FlowGenerationResult) {
    if (_.get(partialFlow, 'flow.nodes.lenght') == 0) {
      throw new Error(`You must provide a flow with at least one node`)
    }

    const completeFlow = this.setDefaultsForMissingValues(partialFlow.flow)

    // Convert ActonBuilderProps to string, since dialog flow can't handle objects
    for (const node of completeFlow.nodes) {
      node.onReceive = this.parseActionQuery(node.onReceive)
      node.onEnter = this.parseActionQuery(node.onEnter)
    }

    // TODO change when studio is updated, since actual doesn't support catchall
    return { flow: completeFlow, transitions: partialFlow.transitions }
  }

  private parseActionQuery(nodes) {
    const strNodes: string[] = []

    if (nodes && nodes.length > 0) {
      _.forEach(nodes, node => {
        strNodes.push(this.actionToString(node))
      })
    }

    return strNodes
  }

  private actionToString(action): string {
    let finalNode: string = ''

    if (action.type === NodeActionType.RunAction) {
      finalNode = action.args ? `${action.name} ${JSON.stringify(action.args)}` : action.name
    } else if (action.type == NodeActionType.RenderText) {
      finalNode = `say #builtin_text ${action.name}`
    } else if (action.type == NodeActionType.RenderElement) {
      finalNode = _.isString(action.args)
        ? `say ${action.name} ${action.args}`
        : `say ${action.name} ${JSON.stringify(action.args)}`
    }

    return finalNode
  }

  private setDefaultsForMissingValues(partialFlow: SkillFlow) {
    const defaultNode: FlowNode = {
      name: '',
      onEnter: [],
      onReceive: [],
      next: []
    }

    _.forEach(partialFlow.nodes, node => {
      defaultNode.id = shortid.generate('1234567890', 6)
      node = _.defaults(node, defaultNode)
    })

    const name = shortid.generate('1234567890', 6)
    const defaultFlow: Flow = {
      version: '0.0',
      name: name,
      location: name,
      startNode: partialFlow.nodes[0].name,
      nodes: []
    }

    return _.defaults(partialFlow, defaultFlow)
  }
}
