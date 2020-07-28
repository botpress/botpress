import { lang } from 'botpress/shared'
import React, { FC } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import style from '../Components/style.scss'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'

const FailureWidget: FC<{ node: FailureNodeModel }> = ({ node }) => {
  return (
    <NodeWrapper>
      <NodeHeader className={style.failure} defaultLabel={lang.tr('studio.flow.node.workflowFails')}>
        <StandardPortWidget name="in" node={node} className={style.in} />
      </NodeHeader>
    </NodeWrapper>
  )
}

export class FailureNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('failure', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class FailureWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('failure')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: FailureNodeModel) {
    return <FailureWidget node={node} />
  }

  getNewInstance() {
    // @ts-ignore
    return new FailureNodeModel()
  }
}
