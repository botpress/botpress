import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'

const { PortWidget, NodeModel, PortModel, NodeWidgetFactory } = require('storm-react-diagrams')

import ActionItem from '../../common/action'

const style = require('./style.scss')

export class StandardIncomingPortModel extends PortModel {
  constructor(name, type = 'normal') {
    super(name)
    this.type = type
  }

  serialize() {
    return _.merge(super.serialize(), {
      type: this.type
    })
  }

  deSerialize(data) {
    super.deSerialize(data)
    this.type = data.type
  }
}

export class StandardOutgoingPortModel extends PortModel {
  constructor(name, type = 'normal') {
    super(name)
    this.type = type
  }

  serialize() {
    return _.merge(super.serialize(), {
      type: this.type
    })
  }

  deSerialize(data) {
    super.deSerialize(data)
    this.type = data.type
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
  render() {
    const className = classnames(this.props.className, {
      [style.inputPort]: this.props.node.ports[this.props.name].type === 'entry',
      [style.exitPort]: this.props.node.ports[this.props.name].type === 'exit'
    })

    return <PortWidget {...this.props} className={className} />
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

    const getElementCls = element => (element.startsWith('@') ? style.msg : style.fn)

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
                    <ActionItem text={item.condition} />
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
  constructor({ onEnter = [], onReceive = [], next = [], name, id, x, y }) {
    super('standard', id)
    this.addPort(new StandardIncomingPortModel('in'))

    // We create as many output port as needed
    for (let i = 0; i < next.length; i++) {
      const nodeType = next[i].node.startsWith('#') ? 'exit' : 'normal'
      this.addPort(new StandardOutgoingPortModel('out' + i, nodeType))
    }

    if (_.isString(onEnter)) {
      onEnter = [onEnter]
    }

    if (_.isString(onReceive)) {
      onReceive = [onReceive]
    }

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
