import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine, NodeModel } from 'storm-react-diagrams'

import ActionItem from '../../common/action'
import ConditionItem from '../../common/condition'

import { StandardIncomingPortModel, StandardOutgoingPortModel, StandardPortWidget } from './Ports'

const style = require('./style.scss')

export class StandardNodeWidget extends Component<{ node: StandardNodeModel }> {
  static defaultProps = {
    size: 200,
    node: null
  }

  state = {}

  render() {
    const node = this.props.node
    const isWaiting = node.waitOnReceive

    const className = classnames(style['node-container'], { [style.highlightedNode]: node.isHighlighted })

    return (
      <div className={className}>
        <div className={style.topPort}>
          <StandardPortWidget name="in" node={node} />
        </div>
        <div className={style.header} />
        <div className={style.content}>
          <div className={classnames(style['section-onEnter'], style.section)}>
            {node.onEnter &&
              node.onEnter.map((item, i) => {
                return <ActionItem key={`${i}.${item}`} className={style.item} text={item} />
              })}
          </div>
          <div className={classnames(style['section-title'], style.section, { [style.waiting]: isWaiting })}>
            {node.name}
          </div>
          <div className={classnames(style['section-onReceive'], style.section)}>
            {node.onReceive &&
              node.onReceive.map((item, i) => {
                return <ActionItem key={`${i}.${item}`} className={style.item} text={item} />
              })}
          </div>
          <div className={classnames(style['section-next'], style.section)}>
            {node.next &&
              node.next.map((item, i) => {
                const outputPortName = `out${i}`
                return (
                  <div key={`${i}.${item}`} className={classnames(style.item)}>
                    <ConditionItem condition={item} position={i} />
                    <StandardPortWidget name={outputPortName} node={node} />
                  </div>
                )
              })}
          </div>
        </div>
        <div className={style.footer}>
          <div />
        </div>
      </div>
    )
  }
}

export class StandardNodeModel extends NodeModel {
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

  constructor({ id, x, y, name, onEnter = [], onReceive = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('standard', id)

    this.setData({ name, onEnter, onReceive, next, isStartNode, isHighlighted })

    if (x) {
      this.x = x
    }
    if (y) {
      this.y = y
    }
  }

  serialize() {
    return _.merge(super.serialize(), {
      name: this.name,
      onEnter: this.onEnter,
      onReceive: this.onReceive,
      next: this.next
    })
  }

  deSerialize(data: any, diagramEngine: DiagramEngine) {
    super.deSerialize(data, diagramEngine)
    this.setData(data)
  }

  getOutPorts() {
    return _.filter(_.values(this.ports), p => p.name.startsWith('out'))
  }

  setData({ name, onEnter = [], onReceive = [], next = [], isStartNode, isHighlighted }) {
    this.isStartNode = isStartNode
    this.isHighlighted = isHighlighted
    const inNodeType = isStartNode ? 'start' : 'normal'
    const waitOnReceive = !_.isNil(onReceive)

    if (!this.ports['in']) {
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
}

export const StandardNodeWidgetFactory = React.createFactory(StandardNodeWidget)

export class StandardWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('standard')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: StandardNodeModel) {
    return <StandardNodeWidget node={node} />
  }

  getNewInstance() {
    // @ts-ignore
    return new StandardNodeModel()
  }
}
