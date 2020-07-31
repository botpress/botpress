import { Intent, Menu, MenuItem } from '@blueprintjs/core'
import { contextMenu, lang, ShortcutLabel } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import style from '../Components/style.scss'
import NodeContentItem from '../Components/NodeContentItem'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'

interface Props {
  node: MapNodeModel
  getCurrentFlow: any
  updateFlowNode: any
  onDeleteSelectedElements: () => void
  switchFlowNode: (id: string) => void
  selectedNodeItem: () => { node: MapNodeModel; index: number }
  editNodeItem: (node: MapNodeModel, index: number) => void
}

const MapWidget: FC<Props> = ({
  node,
  getCurrentFlow,
  onDeleteSelectedElements,
  updateFlowNode,
  switchFlowNode,
  selectedNodeItem,
  editNodeItem
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

  const selectedCondition = selectedNodeItem()

  return (
    <NodeWrapper>
      <NodeHeader
        className={style.listen}
        setExpanded={setExpanded}
        expanded={expanded}
        handleContextMenu={handleContextMenu}
        isEditing={isEditing}
        saveName={saveName}
        defaultLabel={lang.tr('map')}
        name={node.name}
        type={node.type}
        error={error}
      >
        <StandardPortWidget name="in" node={node} className={style.in} />
      </NodeHeader>
      {expanded && (
        <div className={style.contentsWrapper}>
          <Fragment>
            <NodeContentItem
              className={cx(style.hasJoinLabel, {
                [style.active]: selectedCondition?.node?.id === node.id
              })}
              onEdit={() => editNodeItem?.(node, 0)}
            >
              <span className={style.content}>Config</span>
            </NodeContentItem>
          </Fragment>
        </div>
      )}
    </NodeWrapper>
  )
}

export class MapNodeModel extends BaseNodeModel {
  public isNew: boolean

  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('map', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class MapWidgetFactory extends AbstractNodeFactory {
  private editNodeItem: (node: MapNodeModel, index: number) => void
  private deleteSelectedElements: () => void
  private getCurrentFlow: any
  private updateFlowNode: any
  private switchFlowNode: (id: string) => void
  private selectedNodeItem: () => { node: MapNodeModel; index: number }

  constructor(methods) {
    super('map')

    this.deleteSelectedElements = methods.deleteSelectedElements
    this.getCurrentFlow = methods.getCurrentFlow
    this.updateFlowNode = methods.updateFlowNode
    this.switchFlowNode = methods.switchFlowNode
    this.selectedNodeItem = methods.selectedNodeItem
    this.editNodeItem = methods.editNodeItem
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: MapNodeModel) {
    return (
      <MapWidget
        node={node}
        getCurrentFlow={this.getCurrentFlow}
        onDeleteSelectedElements={this.deleteSelectedElements}
        updateFlowNode={this.updateFlowNode}
        switchFlowNode={this.switchFlowNode}
        selectedNodeItem={this.selectedNodeItem}
        editNodeItem={this.editNodeItem}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new MapNodeModel()
  }
}
