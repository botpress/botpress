import _ from 'lodash'
import { DiagramEngine, NodeModel } from 'storm-react-diagrams'

import { StandardIncomingPortModel, StandardOutgoingPortModel } from '../nodes/Ports'

export class BaseNodeModel extends NodeModel {
  public isStartNode = false
  public isHighlighted = false
  public onEnter = undefined
  public onReceive = undefined
  public waitOnReceive = undefined
  public next = undefined
  public oldX?: number
  public oldY?: number
  public lastModified?: Date
  public name: string

  serialize() {
    return _.merge(super.serialize(), {
      name: this.name,
      onEnter: this.onEnter,
      onReceive: [],
      next: this.next
    })
  }

  deSerialize(data: any, diagramEngine: DiagramEngine) {
    super.deSerialize(data, diagramEngine)
    this.setData(data)
  }

  setData({ name, onEnter = [], onReceive = [], next = [], isStartNode, isHighlighted }) {
    const deprecatedFeature = window.USE_ONEFLOW // TODO: remove in 13+

    this.isStartNode = !deprecatedFeature && isStartNode
    this.isHighlighted = isHighlighted
    const inNodeType = isStartNode ? 'start' : 'normal'
    const waitOnReceive = !_.isNil(onReceive)

    if (!this.ports['in'] && this.type !== 'trigger') {
      // TODO: refactor thisfor Trigger
      this.addPort(new StandardIncomingPortModel('in', inNodeType))
    }

    // We create as many output port as needed
    for (let i = 0; i < next.length; i++) {
      if (!this.ports['out' + i]) {
        this.addPort(new StandardOutgoingPortModel('out' + i))
      }
    }

    if (_.isString(onEnter)) {
      onEnter = [onEnter]
    }

    if (_.isString(onReceive)) {
      onReceive = [onReceive]
    } else if (_.isNil(onReceive)) {
      onReceive = []
    }

    onReceive = onReceive.map(x => x.function || x)

    if (!_.isArray(next) && _.isObjectLike(next)) {
      next = [next]
    }

    this.onEnter = onEnter
    this.onReceive = onReceive
    this.waitOnReceive = waitOnReceive
    this.next = next
    this.name = name
  }

  getOutPorts() {
    return _.filter(_.values(this.ports), p => p.name.startsWith('out'))
  }
}
