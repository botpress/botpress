import { Intent, Menu, MenuItem } from '@blueprintjs/core'
import { contextMenu, lang, ShortcutLabel } from 'botpress/shared'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'
import ActionModalSmall from '~/views/FlowBuilder/nodeProps/ActionModalSmall'

import style from '../Components/style.scss'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'

interface Props {
  node: ExecuteNodeModel
  getCurrentFlow: any
  diagramEngine: any
  updateFlowNode: any
  onDeleteSelectedElements: () => void
  switchFlowNode: (id: string) => void
}

const ExecuteWidget: FC<Props> = ({
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

  const handleItemChanged = actionText => {
    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({ onEnter: [actionText] })
  }

  const actionText = (node.onEnter && node.onEnter.length && node.onEnter[0]) || ''

  return (
    <NodeWrapper>
      <NodeHeader
        className={style.execute}
        setExpanded={setExpanded}
        expanded={expanded}
        handleContextMenu={handleContextMenu}
        isEditing={isEditing}
        saveName={saveName}
        defaultLabel={lang.tr('studio.flow.node.chatbotExecutes')}
        name={node.name}
        type={node.type}
        error={error}
      >
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </NodeHeader>
      {expanded && (
        <div className={style.contentsWrapper}>
          <div className={style.contentWrapper}>
            <div className={style.content}>
              <ActionModalSmall text={actionText} onChange={handleItemChanged} layoutv2 />
            </div>
          </div>
        </div>
      )}
    </NodeWrapper>
  )
}

export class ExecuteNodeModel extends BaseNodeModel {
  public isNew: boolean

  constructor({ id, x, y, name, onEnter = [], next = [], isNew = false, isStartNode = false, isHighlighted = false }) {
    super('execute', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted, isNew })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ isNew = false, ...data }) {
    this.isNew = isNew

    super.setData(data as any)
  }
}

export class ExecuteWidgetFactory extends AbstractNodeFactory {
  private deleteSelectedElements: () => void
  private getCurrentFlow: any
  private updateFlowNode: any
  private switchFlowNode: (id: string) => void

  constructor(methods) {
    super('execute')

    this.deleteSelectedElements = methods.deleteSelectedElements
    this.getCurrentFlow = methods.getCurrentFlow
    this.updateFlowNode = methods.updateFlowNode
    this.switchFlowNode = methods.switchFlowNode
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: ExecuteNodeModel) {
    return (
      <ExecuteWidget
        node={node}
        diagramEngine={diagramEngine}
        getCurrentFlow={this.getCurrentFlow}
        onDeleteSelectedElements={this.deleteSelectedElements}
        updateFlowNode={this.updateFlowNode}
        switchFlowNode={this.switchFlowNode}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new ExecuteNodeModel()
  }
}
