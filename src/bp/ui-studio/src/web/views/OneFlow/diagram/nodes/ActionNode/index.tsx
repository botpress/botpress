import { Intent, Menu, MenuItem } from '@blueprintjs/core'
import { contextMenu, lang, ShortcutLabel } from 'botpress/shared'
import { parseActionInstruction } from 'common/action'
import { ActionServer } from 'common/typings'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'
import ActionDialog from '~/views/FlowBuilder/nodeProps/ActionDialog'

import style from '../Components/style.scss'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'

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

interface Props {
  node: ActionNodeModel
  getCurrentFlow: any
  updateFlowNode: any
  onDeleteSelectedElements: () => void
  switchFlowNode: (id: string) => void
  diagramEngine: any
}

const ActionWidget: FC<Props> = ({
  node,
  getCurrentFlow,
  onDeleteSelectedElements,
  updateFlowNode,
  switchFlowNode,
  diagramEngine
}) => {
  const [expanded, setExpanded] = useState(node.isNew)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const handleContextMenu = e => {
    e.stopPropagation()
    e.preventDefault()
    switchFlowNode(node.id)
    contextMenu(
      e,
      <Menu>
        <MenuItem
          text={lang.tr('studio.flow.node.renameBlock')}
          onClick={() => {
            setIsEditing(true)
          }}
        />
        <MenuItem
          text={
            <div className={style.contextMenuLabel}>
              {lang.tr('delete')}
              <ShortcutLabel light keys={['backspace']} />
            </div>
          }
          intent={Intent.DANGER}
          onClick={onDeleteSelectedElements}
        />
      </Menu>
    )
  }

  const saveName = (value): void => {
    setError(null)

    if (value) {
      const alreadyExists = getCurrentFlow().nodes.find(x => x.name === value && x.id !== node.id)

      if (alreadyExists) {
        setError(lang.tr('studio.flow.node.nameAlreadyExists'))
        return
      }

      updateFlowNode({ name: value })
    }

    setIsEditing(false)
  }

  const onSave = action => {
    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({ onEnter: [serializeAction(action)] })
  }

  return (
    <NodeWrapper>
      <NodeHeader
        className={style.action}
        setExpanded={setExpanded}
        expanded={expanded}
        handleContextMenu={handleContextMenu}
        isEditing={isEditing}
        saveName={saveName}
        defaultLabel={lang.tr('action')}
        name={node.name}
        type={node.type}
        error={error}
      >
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </NodeHeader>
      {expanded && (
        <div className={style.contentsWrapper}>
          <ActionNodeContent action={parseActionString(node.onEnter[0])} onSave={onSave} />
        </div>
      )}
    </NodeWrapper>
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
  public isNew: boolean

  constructor({ id, x, y, name, onEnter = [], next = [], isNew = false, isStartNode = false, isHighlighted = false }) {
    super('action', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ isNew = false, ...data }) {
    this.isNew = isNew

    super.setData(data as any)
  }
}

export class ActionWidgetFactory extends AbstractNodeFactory {
  private deleteSelectedElements: () => void
  private getCurrentFlow: any
  private updateFlowNode: any
  private switchFlowNode: (id: string) => void

  constructor(methods) {
    super('action')

    this.deleteSelectedElements = methods.deleteSelectedElements
    this.getCurrentFlow = methods.getCurrentFlow
    this.updateFlowNode = methods.updateFlowNode
    this.switchFlowNode = methods.switchFlowNode
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: ActionNodeModel) {
    return (
      <ActionWidget
        node={node}
        getCurrentFlow={this.getCurrentFlow}
        onDeleteSelectedElements={this.deleteSelectedElements}
        updateFlowNode={this.updateFlowNode}
        switchFlowNode={this.switchFlowNode}
        diagramEngine={diagramEngine}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new ActionNodeModel()
  }
}
