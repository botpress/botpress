import { Button, Icon, Intent, Menu, MenuItem, Tooltip } from '@blueprintjs/core'
import { FormData } from 'botpress/sdk'
import { Contents, contextMenu, lang, ShortcutLabel } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import style from '../Components/style.scss'
import NodeContentItem from '../Components/NodeContentItem'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'

interface Props {
  node: TriggerNodeModel
  getCurrentFlow: any
  updateFlowNode: any
  onDeleteSelectedElements: () => void
  editNodeItem: (node: TriggerNodeModel, index: number) => void
  selectedNodeItem: () => { node: TriggerNodeModel; index: number }
  getConditions: () => any
  switchFlowNode: (id: string) => void
  addCondition: () => void
}

const TriggerWidget: FC<Props> = ({
  node,
  getCurrentFlow,
  editNodeItem,
  onDeleteSelectedElements,
  selectedNodeItem,
  updateFlowNode,
  getConditions,
  switchFlowNode,
  addCondition
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
          text={lang.tr('studio.flow.node.addCondition')}
          onClick={() => {
            addCondition()
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

  const conditionLabels = getConditions().reduce((acc, cond) => ({ ...acc, [cond.id]: cond.label }), {})
  const selectedCondition = selectedNodeItem()

  return (
    <NodeWrapper>
      <NodeHeader
        className={style.trigger}
        setExpanded={setExpanded}
        expanded={expanded}
        handleContextMenu={handleContextMenu}
        isEditing={isEditing}
        saveName={saveName}
        defaultLabel={lang.tr('studio.flow.node.triggeredBy')}
        name={node.name}
        type={node.type}
        error={error}
      >
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </NodeHeader>
      {expanded && (
        <div className={style.contentsWrapper}>
          {node.conditions?.map((condition, index) => (
            <Fragment key={index}>
              <NodeContentItem
                className={cx(style.hasJoinLabel, {
                  [style.active]: selectedCondition?.node?.id === node.id && index === selectedCondition?.index
                })}
                onEdit={() => editNodeItem?.(node, index)}
              >
                <span className={style.content}>{lang.tr(conditionLabels[condition.id], { ...condition.params })}</span>
              </NodeContentItem>
              <span className={style.joinLabel}>{lang.tr('and')}</span>
            </Fragment>
          ))}
        </div>
      )}
    </NodeWrapper>
  )
}

export class TriggerNodeModel extends BaseNodeModel {
  public conditions = []
  public activeWorkflow: boolean
  public isNew: boolean

  constructor({
    id,
    x,
    y,
    name,
    onEnter = [],
    next = [],
    conditions = [],
    activeWorkflow = false,
    isNew = false,
    isStartNode = false,
    isHighlighted = false
  }) {
    super('trigger', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted, conditions, activeWorkflow, isNew })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ conditions = [], activeWorkflow = false, isNew = false, ...data }) {
    this.conditions = conditions
    this.activeWorkflow = activeWorkflow
    this.isNew = isNew

    super.setData(data as any)
  }
}

export class TriggerWidgetFactory extends AbstractNodeFactory {
  private editNodeItem: (node: TriggerNodeModel, index: number) => void
  private selectedNodeItem: () => { node: TriggerNodeModel; index: number }
  private deleteSelectedElements: () => void
  private getConditions: () => string
  private getCurrentFlow: any
  private updateFlowNode: any
  private switchFlowNode: (id: string) => void
  private addCondition: () => void

  constructor(methods) {
    super('trigger')

    this.editNodeItem = methods.editNodeItem
    this.selectedNodeItem = methods.selectedNodeItem
    this.deleteSelectedElements = methods.deleteSelectedElements
    this.getCurrentFlow = methods.getCurrentFlow
    this.updateFlowNode = methods.updateFlowNode
    this.getConditions = methods.getConditions
    this.switchFlowNode = methods.switchFlowNode
    this.addCondition = methods.addCondition
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: TriggerNodeModel) {
    return (
      <TriggerWidget
        node={node}
        getCurrentFlow={this.getCurrentFlow}
        editNodeItem={this.editNodeItem}
        onDeleteSelectedElements={this.deleteSelectedElements}
        updateFlowNode={this.updateFlowNode}
        selectedNodeItem={this.selectedNodeItem}
        getConditions={this.getConditions}
        switchFlowNode={this.switchFlowNode}
        addCondition={this.addCondition}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new TriggerNodeModel()
  }
}
