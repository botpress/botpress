import classnames from 'classnames'
import { parseActionInstruction } from 'common/action'
import { ActionServer } from 'common/typings'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import ActionDialog from '../../nodeProps/ActionDialog'
import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader } from './utils'

const ActionInfo: FC<{ action: Action }> = props => {
  const { action } = props

  if (!action.name || !action.actionServerId) {
    return <>⚠️ No action chosen</>
  }

  return (
    <>
      {action.name} ({action.actionServerId})
    </>
  )
}

const ActionNodeContent: FC<{ action: Action; onSave: (action: Action) => void }> = props => {
  const [showDialog, setShowDialog] = useState(false)

  const { action, onSave } = props
  return (
    <div className={style.content} onDoubleClick={() => setShowDialog(true)}>
      <ActionInfo action={action} />
      <ActionDialog
        name={action.name}
        parameters={action.parameters}
        actionServerId={action.actionServerId}
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false)
        }}
        onSave={action => {
          setShowDialog(false)
          onSave(action)
        }}
      />
    </div>
  )
}

const ActionWidget: FC<{
  node: ActionNodeModel
  diagramEngine: any
}> = props => {
  const { node, diagramEngine } = props

  const onSave = action => {
    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({ onEnter: [serializeAction(action)] })
  }

  return (
    <div className={classnames(style.baseNode, style.nodeAction, { [style.highlightedNode]: node.isHighlighted })}>
      {showHeader({ nodeType: 'Action', nodeName: node.name, isStartNode: node.isStartNode })}
      <ActionNodeContent action={parseActionString(node.onEnter[0])} onSave={onSave} />
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
  const firstPart = action.actionServerId ? `${action.actionServerId}:${action.name}` : action.name
  return [firstPart, JSON.stringify(action.parameters)].join(' ')
}

const parseActionString = (actionString: string | undefined): Action => {
  let name = ''
  let parameters = {}
  let actionServerId = ''

  if (actionString) {
    const result = parseActionInstruction(actionString)
    name = result.actionName

    const parametersString = result.argsStr
    parameters = JSON.parse(parametersString)

    actionServerId = result.actionServerId
  }

  return { name, parameters, actionServerId }
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
