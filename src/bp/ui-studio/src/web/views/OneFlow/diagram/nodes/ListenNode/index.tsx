import { Intent, Menu, MenuItem } from '@blueprintjs/core'
import { contextMenu, lang, ShortcutLabel } from 'botpress/shared'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import style from '../Components/style.scss'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'

interface Props {
  node: ListenNodeModel
  getCurrentFlow: any
  updateFlowNode: any
  onDeleteSelectedElements: () => void
  switchFlowNode: (id: string) => void
}

const ListenWidget: FC<Props> = ({
  node,
  getCurrentFlow,
  onDeleteSelectedElements,
  updateFlowNode,
  switchFlowNode
}) => {
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

  return (
    <NodeWrapper>
      <NodeHeader
        className={style.listen}
        handleContextMenu={handleContextMenu}
        isEditing={isEditing}
        saveName={saveName}
        defaultLabel={lang.tr('listen')}
        name={node.name}
        type={node.type}
        error={error}
      >
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </NodeHeader>
    </NodeWrapper>
  )
}

export class ListenNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('listen', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class ListenWidgetFactory extends AbstractNodeFactory {
  private deleteSelectedElements: () => void
  private getCurrentFlow: any
  private updateFlowNode: any
  private switchFlowNode: (id: string) => void

  constructor(methods) {
    super('listen')

    this.deleteSelectedElements = methods.deleteSelectedElements
    this.getCurrentFlow = methods.getCurrentFlow
    this.updateFlowNode = methods.updateFlowNode
    this.switchFlowNode = methods.switchFlowNode
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: ListenNodeModel) {
    return (
      <ListenWidget
        node={node}
        getCurrentFlow={this.getCurrentFlow}
        onDeleteSelectedElements={this.deleteSelectedElements}
        updateFlowNode={this.updateFlowNode}
        switchFlowNode={this.switchFlowNode}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new ListenNodeModel()
  }
}
