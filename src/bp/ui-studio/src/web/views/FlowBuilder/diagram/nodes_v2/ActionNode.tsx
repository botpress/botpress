import { Button, Dialog, HTMLSelect, Label } from '@blueprintjs/core'
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

  const [showDialog, setShowDialog] = useState(false)
  const [action, setAction] = useState(
    node.action ? _.cloneDeep(node.action) : { name: '', actionServerId: '', parameters: {} }
  )

  const actionCopy = _.cloneDeep(node.action)
  console.log('actionCopy:', actionCopy)
  console.log('action:', action)

  const onSave = () => {
    setShowDialog(false)
    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({ onEnter: [serializeAction(action)] })
  }

  const cancel = () => {
    console.log('cancelling')
    setAction(actionCopy)
    // initializeAction()
  }

  // const initializeAction = () => {
  //   action = node.action ? node.action : { name: '', actionServerId: '', parameters: {} }
  // }

  // initializeAction()

  return (
    <div className={classnames(style.baseNode, style.nodeAction, { [style.highlightedNode]: node.isHighlighted })}>
      {showHeader({ nodeType: 'Action', nodeName: node.name, isStartNode: node.isStartNode })}
      <Button onClick={() => setShowDialog(true)}>Edit</Button>
      <ActionDialog
        action={action}
        // actionParameters={Object.entries(action.parameters).map(([key, value]) => ({ key, value }))}
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false)
          cancel()
        }}
        onUpdate={action => setAction(action)}
        onSave={onSave}
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

const parseActionString = (actionString: string): Action => {
  const chunks = actionString.split(' ')
  const parametersString = chunks[1]
  const parameters = parametersString ? JSON.parse(parametersString) : {}
  return { name: chunks[0], parameters, actionServerId: chunks[3] }
}

const serializeAction = (action: Action): string => {
  return [action.name, JSON.stringify(action.parameters), action.actionServerId].join(' ')
}

export class ActionNodeModel extends BaseNodeModel {
  action?: Action

  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('action', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y

    if (onEnter.length === 1) {
      const actionString = onEnter[0]
      this.action = parseActionString(actionString)
    }
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
