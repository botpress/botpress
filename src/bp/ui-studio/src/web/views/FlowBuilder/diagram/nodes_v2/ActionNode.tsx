import { Button } from '@blueprintjs/core'
import classnames from 'classnames'
import { ActionServer } from 'common/typings'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import ActionDialog from '../../nodeProps/ActionDialog'
import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader } from './utils'

interface ActionWidgetProps {
  node: ActionNodeModel
  diagramEngine: any
}

const ActionWidget: FC<ActionWidgetProps> = props => {
  const { node, diagramEngine } = props

  const parseActionString = (actionString: string | undefined): Action => {
    let name = ''
    let parameters = {}
    let actionServerId = ''

    if (actionString) {
      const chunks = actionString.split(' ')
      name = chunks[0]

      const parametersString = chunks[1]
      parameters = JSON.parse(parametersString)

      actionServerId = chunks[2]
    }

    return { name, parameters, actionServerId }
  }

  const [showDialog, setShowDialog] = useState(false)
  const [actionString, setActionString] = useState(node.onEnter[0])
  const actionStringCopy = node.onEnter[0]

  const onSave = action => {
    setShowDialog(false)
    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    const actionString = serializeAction(action)
    flowBuilder.updateFlowNode({ onEnter: [actionString] })
    setActionString(actionString)
  }

  const cancel = () => {
    setActionString(actionStringCopy)
  }

  const action = parseActionString(actionString)
  return (
    <div className={classnames(style.baseNode, style.nodeAction, { [style.highlightedNode]: node.isHighlighted })}>
      {showHeader({ nodeType: 'Action', nodeName: node.name, isStartNode: node.isStartNode })}
      <Button onClick={() => setShowDialog(true)}>Edit</Button>
      <ActionDialog
        name={action.name}
        parameters={action.parameters}
        actionServerId={action.actionServerId}
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false)
          cancel()
        }}
        onSave={action => onSave(action)}
      />
      <div className={style.ports}>
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </div>
    </div>
  )
}

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp]

export interface Parameters {
  [name: string]: string
}

export interface Action {
  name: string
  parameters: Parameters
  actionServerId: PropType<ActionServer, 'id'>
}

const serializeAction = (action: Action): string => {
  return [action.name, JSON.stringify(action.parameters), action.actionServerId].join(' ')
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
