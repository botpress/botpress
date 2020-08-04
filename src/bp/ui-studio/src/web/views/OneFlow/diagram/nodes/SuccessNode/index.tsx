import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import style from '../Components/style.scss'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'

const SuccessWidget: FC<{ node: SuccessNodeModel }> = ({ node }) => {
  return (
    <NodeWrapper>
      <NodeHeader className={style.success} defaultLabel={lang.tr('studio.flow.node.workflowSucceeds')}>
        <StandardPortWidget name="in" node={node} className={style.in} />
      </NodeHeader>
    </NodeWrapper>
  )
}

export class SuccessNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('success', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class SuccessWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('success')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: SuccessNodeModel) {
    return <SuccessWidget node={node} />
  }

  getNewInstance() {
    // @ts-ignore
    return new SuccessNodeModel()
  }
}
