import classnames from 'classnames'
import _ from 'lodash'
import React from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { DefaultPortModel, PortWidget } from 'storm-react-diagrams'

import { newNodeTypes } from '../manager'

import style from './style.scss'

export class StandardIncomingPortModel extends DefaultPortModel {
  constructor(name: string, type: string) {
    super(true, name, type)
  }

  serialize() {
    return _.merge(super.serialize(), {})
  }

  deSerialize(data, engine) {
    super.deSerialize(data, engine)
  }
}

export class StandardOutgoingPortModel extends DefaultPortModel {
  constructor(name: string) {
    super(false, name)
  }

  serialize() {
    return _.merge(super.serialize(), {})
  }

  deSerialize(data, engine) {
    super.deSerialize(data, engine)
  }
}

type Props = {
  className?: string
  name: string
  node: any
} & RouteComponentProps

export class StandardPortWidgetDisconnected extends React.Component<Props> {
  renderSubflowNode() {
    const node = this.props.node
    const index = Number(this.props.name.replace('out', ''))
    const subflow = node.next[index].node.replace(/\.flow\.json/i, '')

    return (
      <div className={style.label}>
        <a href="javascript:void(0);" onClick={() => this.props.history.push(`/flows/${subflow}`)}>
          {subflow}
        </a>
      </div>
    )
  }

  renderEndNode() {
    return <div className={style.label}>End of flow</div>
  }

  renderStartNode() {
    return <div className={style.label}>Start</div>
  }

  renderReturnNode() {
    const node = this.props.node
    const index = Number(this.props.name.replace('out', ''))
    let returnTo = node.next[index].node.substr(1)

    if (!returnTo.length) {
      returnTo = '@calling'
    }

    return <div className={style.label}>Return ({returnTo})</div>
  }

  render() {
    let type = 'normal'
    let missingConnection = false

    if (this.props.name === 'in' && this.props.node.isStartNode) {
      type = 'start'
    } else if (this.props.name !== 'in') {
      const index = Number(this.props.name.replace(/out/i, ''))
      const nextNode = _.get(this.props.node, `next.${index}`)

      if (!nextNode) {
        missingConnection = true
      } else if (nextNode.node && nextNode.node.toLowerCase() === 'end') {
        type = 'end'
      } else if (/\.flow\.json/i.test(nextNode.node)) {
        type = 'subflow'
      } else if (/^#/i.test(nextNode.node)) {
        type = 'return'
      } else if (nextNode.node === '') {
        missingConnection = true
      }
    }

    const className = classnames(this.props.className, style.portContainer, {
      [style.startPort]: type === 'start',
      [style.subflowPort]: type === 'subflow',
      [style.endPort]: type === 'end',
      [style.returnPort]: type === 'return',
      [style.portLabel]: /end|subflow|start|return/i.test(type),
      [style.missingConnection]: missingConnection
    })

    const isNewNodeType = newNodeTypes.includes(this.props.node.type)
    return (
      <div className={className}>
        <PortWidget {...this.props} />
        {type === 'subflow' && this.renderSubflowNode()}
        {type === 'end' && this.renderEndNode()}
        {!isNewNodeType && type === 'start' && this.renderStartNode()}
        {type === 'return' && this.renderReturnNode()}
      </div>
    )
  }
}

export const StandardPortWidget = withRouter(StandardPortWidgetDisconnected)
