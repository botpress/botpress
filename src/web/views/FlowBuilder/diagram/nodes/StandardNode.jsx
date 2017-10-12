import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'

const { PortWidget, NodeModel, PortModel, NodeWidgetFactory } = require('storm-react-diagrams')

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
    // this.position = data.position
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
    // this.position = data.position
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
          <PortWidget name="in" node={node} />
        </div>
        <div className={style.header} />
        <div className={style.content}>
          <div className={classnames(style['section-onEnter'], style.section)}>
            {node.onEnter &&
              node.onEnter.map(item => {
                return <div className={classnames(style.item, getElementCls(item))}>{item}</div>
              })}
          </div>
          <div className={classnames(style['section-title'], style.section)}>{node.name}</div>
          <div className={classnames(style['section-onReceive'], style.section)}>
            {node.onReceive &&
              node.onReceive.map(item => {
                return <div className={classnames(style.item, getElementCls(item))}>{item}</div>
              })}
          </div>
          <div className={classnames(style['section-next'], style.section)}>
            {node.next &&
              node.next.map((item, i) => {
                const outputPortName = `out${i}`
                console.log(item)

                return (
                  <div className={classnames(style.item, style.fn)}>
                    <div className="">{item.condition}</div>
                    <PortWidget name={outputPortName} node={node} />
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
  constructor({ onEnter = [], onReceive = [], next = [], name }) {
    super('standard')
    this.addPort(new StandardIncomingPortModel('in'))

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

    if (!_.isArray(next) && _.isObjectLike(next)) {
      next = [next]
    }

    this.onEnter = onEnter
    this.onReceive = onReceive
    this.next = next
    this.name = name
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
