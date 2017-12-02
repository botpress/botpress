import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

const { PortWidget, NodeModel, PortModel, NodeWidgetFactory } = require('storm-react-diagrams')

import ActionItem from '../../common/action'
import ConditionItem from '../../common/condition'

const style = require('./style.scss')

export class StandardIncomingPortModel extends PortModel {
  constructor(name) {
    super(name)
  }

  serialize() {
    return _.merge(super.serialize(), {})
  }

  deSerialize(data) {
    super.deSerialize(data)
  }
}

export class StandardOutgoingPortModel extends PortModel {
  constructor(name) {
    super(name)
  }

  serialize() {
    return _.merge(super.serialize(), {})
  }

  deSerialize(data) {
    super.deSerialize(data)
  }
}

export class StandardWidgetFactory extends NodeWidgetFactory {
  constructor() {
    super('standard')
  }

  generateReactWidget(diagramEngine, node) {
    return StandardNodeWidgetFactory({ node: node })
  }
}

export class StandardPortWidget extends React.Component {
  renderSubflowNode() {
    const node = this.props.node
    const index = Number(this.props.name.replace('out', ''))
    const subflow = node.next[index].node

    return <div className={style.label}>{subflow}</div>
  }

  renderEndNode() {
    return <div className={style.label}>End of flow</div>
  }

  renderStartNode() {
    return <div className={style.label}>Start</div>
  }

  render() {
    let type = 'normal'
    let missingConnection = false

    if (this.props.name === 'in') {
      if (this.props.node.isStartNode) {
        type = 'start'
      }
    } else {
      const index = Number(this.props.name.replace(/out/i, ''))
      const nextNode = _.get(this.props.node, 'next.' + index)

      if (nextNode.node && nextNode.node.toLowerCase() === 'end') {
        type = 'end'
      } else if (/\.flow\.json/i.test(nextNode.node)) {
        type = 'subflow'
      } else if (nextNode.node === '') {
        missingConnection = true
      }
    }

    const className = classnames(this.props.className, style.portContainer, {
      [style.startPort]: type === 'start',
      [style.subflowPort]: type === 'subflow',
      [style.endPort]: type === 'end',
      [style.portLabel]: /end|subflow|start/i.test(type),
      [style.missingConnection]: missingConnection
    })

    return (
      <div className={className}>
        <PortWidget {...this.props} />
        {type === 'subflow' && this.renderSubflowNode()}
        {type === 'end' && this.renderEndNode()}
        {type === 'start' && this.renderStartNode()}
      </div>
    )
  }
}

export class StandardNodeWidget extends React.Component {
  static defaultProps = {
    size: 200,
    node: null
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const node = this.props.node
    const isWaiting = node.waitOnReceive

    return (
      <div className={style['standard-node']}>
        <div className={style.topPort}>
          <StandardPortWidget name="in" node={node} />
        </div>
        <div className={style.header} />
        <div className={style.content}>
          <div className={classnames(style['section-onEnter'], style.section)}>
            {node.onEnter &&
              node.onEnter.map((item, i) => {
                return <ActionItem key={i} className={style.item} text={item} />
              })}
          </div>
          <div className={classnames(style['section-title'], style.section, { [style.waiting]: isWaiting })}>
            {node.name}
          </div>
          <div className={classnames(style['section-onReceive'], style.section)}>
            {node.onReceive &&
              node.onReceive.map((item, i) => {
                return <ActionItem key={i} className={style.item} text={item} />
              })}
          </div>
          <div className={classnames(style['section-next'], style.section)}>
            {node.next &&
              node.next.map((item, i) => {
                const outputPortName = `out${i}`
                return (
                  <div key={i} className={classnames(style.item)}>
                    <ConditionItem text={item.condition} position={i} />
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
    let inNodeType = isStartNode ? 'start' : 'normal'
    const waitOnReceive = !_.isNil(onReceive)

    if (!this.ports['in']) {
      this.addPort(new StandardIncomingPortModel('in', inNodeType))
    }

    // We create as many output port as needed
    for (var i = 0; i < next.length; i++) {
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
