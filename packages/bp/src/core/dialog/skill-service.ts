import { ActionBuilderProps, Flow, FlowGenerationResult, FlowNode, NodeActionType, SkillFlow } from 'botpress/sdk'
import { injectable } from 'inversify'
import _ from 'lodash'
import { customAlphabet } from 'nanoid'

@injectable()
export class SkillService {
  constructor() {}

  public finalizeFlow(partialFlow: FlowGenerationResult) {
    if (_.get(partialFlow, 'flow.nodes.length') === 0) {
      throw new Error('You must provide a flow with at least one node')
    }

    const completeFlow = this.setDefaultsForMissingValues(partialFlow.flow)

    // Convert ActonBuilderProps to string, since dialog flow can't handle objects
    for (const node of completeFlow.nodes) {
      node.onReceive = this.parseActionQuery(node.onReceive)
      node.onEnter = this.parseActionQuery(node.onEnter)
    }

    // TODO change when studio is updated, since actual doesn't support catchall
    return {
      flow: completeFlow,
      transitions: partialFlow.transitions,
      ...(partialFlow.previewElements && { preview: partialFlow.previewElements })
    }
  }

  private parseActionQuery(nodes): string[] | undefined {
    if (typeof nodes === 'undefined') {
      return undefined
    }

    return (nodes && nodes.length && nodes.map(this.actionToString)) || []
  }

  private actionToString(action: ActionBuilderProps): string {
    let finalNode: string = ''
    if (action.type === NodeActionType.RunAction) {
      finalNode = action.args ? `${action.name} ${JSON.stringify(action.args)}` : action.name
    } else if (action.type === NodeActionType.RenderText) {
      finalNode = `say #builtin_text ${action.name}`
    } else if (action.type === NodeActionType.RenderElement) {
      const args = action.args || {}
      finalNode = _.isString(args) ? `say ${action.name} ${args}` : `say ${action.name} ${JSON.stringify(args)}`
    }

    return finalNode
  }

  private setDefaultsForMissingValues(partialFlow: SkillFlow): Flow {
    const defaultNode: FlowNode = {
      name: '',
      onEnter: [],
      onReceive: undefined,
      next: []
    }

    _.forEach(partialFlow.nodes, node => {
      defaultNode.id = customAlphabet('1234567890', 6)()
      node = _.defaults(node, defaultNode)
    })

    const name = customAlphabet('1234567890', 6)()
    const defaultFlow: Flow = {
      version: '0.0',
      name,
      location: name,
      startNode: partialFlow.nodes[0].name,
      nodes: []
    }

    return _.defaults(partialFlow, defaultFlow)
  }
}
