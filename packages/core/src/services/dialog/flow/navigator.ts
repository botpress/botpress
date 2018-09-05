import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../../../misc/types'
import { DialogSession } from '../../../repositories/session-repository'

import FlowService from './service'

@injectable()
export class FlowNavigator {
  constructor(@inject(TYPES.FlowService) private flowService: FlowService) {}

  async navigate(botId: string, target: string, session: DialogSession): Promise<DialogSession> {
    const context = _.get(session, 'context')
    let newContext = { ...context, previousNode: context.currentNode, previousFlow: context.currentFlow }
    let node: any
    let flow: any

    if (target.indexOf('##') > -1) {
      node = context.previousNode
      flow = context.previousFlow
    } else if (target.indexOf('#') > -1) {
      const nodeName = target.slice(1)
      node = context.previousFlow.nodes.find(n => n.name === nodeName)
      flow = context.previousFlow
    } else {
      node = context.currentFlow.nodes.find(x => x.name === target)
    }

    if (!node) {
      const flows = await this.flowService.loadAll(botId)
      flow = flows.find(x => x.name === target)
      if (!flow) {
        throw new Error(`Could not find any node or flow under the name of "${target}"`)
      }
      node = this.flowService.findEntryNode(flow)
    }

    newContext = { ...newContext, currentNode: node }
    if (flow) {
      newContext = { ...newContext, currentFlow: flow }
    }

    session.context = newContext
    return session
  }
}
