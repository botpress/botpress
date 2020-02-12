import { Button, Dialog, HTMLSelect, Label } from '@blueprintjs/core'
import classnames from 'classnames'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import ActionDialog from '../../nodeProps/ActionDialog'
import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader } from './utils'

const ActionWidget: FC<{ node: ActionNodeModel; diagramEngine: any }> = props => {
  const { node } = props

  const [showDialog, setShowDialog] = useState(false)

  return (
    <div className={classnames(style.baseNode, style.nodeAction, { [style.highlightedNode]: node.isHighlighted })}>
      {showHeader({ nodeType: 'Action', nodeName: node.name, isStartNode: node.isStartNode })}
      <Button onClick={() => setShowDialog(true)}>Edit</Button>
      <ActionDialog isOpen={showDialog} onClose={() => setShowDialog(false)} />
      <div className={style.ports}>
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </div>
    </div>
  )
}

export class ActionNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('action', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class ActionWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('action')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: ActionNodeModel) {
    return <ActionWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new ActionNodeModel()
  }
}
