import { Button } from '@blueprintjs/core'
import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeaderV2 } from './utils'

export class TriggerWidget extends Component<{ node: TriggerNodeModel; diagramEngine: any }> {
  render() {
    const node = this.props.node

    const handleItemChanged = currentItem => {
      // TODO: Update
      const flowBuilder = this.props.diagramEngine.flowBuilder.props
      flowBuilder.switchFlowNode(this.props.node.id)
      flowBuilder.updateFlowNode({ onEnter: [`say #!${currentItem.id}`] })
    }

    return (
      <div className={classnames(style.baseNode, style.nodeTrigger, { [style.highlightedNode]: node.isHighlighted })}>
        {showHeaderV2({ nodeType: 'NLU Trigger', nodeName: node.name, isStartNode: node.isStartNode })}
        <div className={style.content}>
          <ul>
            <li>Request access</li>
            <li>Request access like @theman</li>
            <li>request trello access for @theman like @deepanchu</li>
          </ul>
        </div>
        <div className={style.ports}>
          <StandardPortWidget name="out0" node={node} className={style.out} />
        </div>
      </div>
    )
  }
}

export class TriggerNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('trigger', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class TriggerWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('trigger')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: TriggerNodeModel) {
    return <TriggerWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new TriggerNodeModel()
  }
}
