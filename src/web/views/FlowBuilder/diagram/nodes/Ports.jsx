import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

const { PortWidget, PortModel } = require('storm-react-diagrams')

const style = require('./style.scss')

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
