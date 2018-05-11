import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import { NodeModel, NodeFactory } from 'storm-react-diagrams'

import { StandardOutgoingPortModel, StandardPortWidget, StandardIncomingPortModel } from './Ports'
import ActionItem from '../../common/action'
import ConditionItem from '../../common/condition'

const style = require('./style.scss')

export class StandardNodeWidget extends Component {
  static defaultProps = {
    size: 200,
    node: null
  }

  state = {}

  render() {
    const node = this.props.node
    const isWaiting = node.waitOnReceive

    const className = classnames(style['node-container'])

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
  constructor({ id, x, y, name, onEnter = [], onReceive = [], next = [], isStartNode = false }) {
    super('standard', id)

    this.setData({ name, onEnter, onReceive, next, isStartNode })

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

  deSerialize(data) {
    super.deSerialize(data)

    this.setData({ name: data.name, onEnter: data.onEnter, onReceive: data.onReceive, next: data.next })
  }

  getOutPorts() {
    return _.filter(_.values(this.ports), p => p.name.startsWith('out'))
  }

  setData({ name, onEnter = [], onReceive = [], next = [], isStartNode }) {
    this.isStartNode = isStartNode
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

export class StandardWidgetFactory extends NodeFactory {
  constructor() {
    super('standard')
  }

  generateReactWidget(diagramEngine, node) {
    return StandardNodeWidgetFactory({ node })
  }
}
