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

    const nextNode = this.props.node.ports[this.props.name]

    if (this.props.name === 'in' && this.props.node.isStartNode) {
      type = 'start'
    } else if (nextNode.node && nextNode.node.toLowerCase() === 'end') {
      type = 'end'
    } else if (/\.flow\.json/i.test(nextNode.node)) {
      type = 'subflow'
    }

    const className = classnames(this.props.className, style.portContainer, {
      [style.startPort]: type === 'start',
      [style.subflowPort]: type === 'subflow',
      [style.endPort]: type === 'end',
      [style.portLabel]: /end|subflow|start/i.test(type)
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
    size: 150,
    node: null
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const node = this.props.node

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
          <div className={classnames(style['section-title'], style.section)}>{node.name}</div>
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
                    <ConditionItem text={item.condition} />
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
  constructor({ onEnter = [], onReceive = [], next = [], name, id, x, y, isStartNode }) {
    super('standard', id)

    this.isStartNode = isStartNode
    let inNodeType = isStartNode ? 'start' : 'normal'

    this.addPort(new StandardIncomingPortModel('in', inNodeType))

    // We create as many output port as needed
    for (var i = 0; i < next.length; i++) {
      this.addPort(new StandardOutgoingPortModel('out' + i))
    }

    if (_.isString(onEnter)) {
      onEnter = [onEnter]
    }

    if (_.isString(onReceive)) {
      onReceive = [onReceive]
    }

    onReceive = onReceive.map(x => x.function || x)

    if (!_.isArray(next) && _.isObjectLike(next)) {
      next = [next]
    }

    this.onEnter = onEnter
    this.onReceive = onReceive
    this.next = next
    this.name = name

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

    this.name = data.name
    this.onEnter = data.onEnter
    this.onReceive = data.onReceive
    this.next = data.next

    // TODO
    console.log('deSerialize: TODO -> Remove / Add output ports', this.getPorts())
    // TODO this.addPort(port)
    // this.removePort(port)
    // this.getPort(name)
  }
}

export const StandardNodeWidgetFactory = React.createFactory(StandardNodeWidget)
