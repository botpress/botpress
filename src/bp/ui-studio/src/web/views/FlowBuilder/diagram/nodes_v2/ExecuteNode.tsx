import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import ActionModalSmall from '../../nodeProps/ActionModalSmall'
import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader } from './utils'

export class ExecuteWidget extends Component<{ node: ExecuteNodeModel; diagramEngine: any }> {
  handleItemChanged = actionText => {
    const flowBuilder = this.props.diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(this.props.node.id)
    flowBuilder.updateFlowNode({ onEnter: [actionText] })
  }

  render() {
    const node = this.props.node
    const actionText = (node.onEnter && node.onEnter.length && node.onEnter[0]) || ''

    return (
      <div className={classnames(style.baseNode, style.nodeExecute, { [style.highlightedNode]: node.isHighlighted })}>
        {showHeader({ nodeType: 'Execute', nodeName: node.name, isStartNode: node.isStartNode })}
        <div className={style.content}>
          <ActionModalSmall text={actionText} onChange={this.handleItemChanged} layoutv2 />
        </div>
        <div className={style.ports}>
          <StandardPortWidget name="in" node={node} className={style.in} />
          <StandardPortWidget name="out0" node={node} className={style.out} />
        </div>
      </div>
    )
  }
}

export class ExecuteNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('execute', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class ExecuteWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('execute')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: ExecuteNodeModel) {
    return <ExecuteWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new ExecuteNodeModel()
  }
}
