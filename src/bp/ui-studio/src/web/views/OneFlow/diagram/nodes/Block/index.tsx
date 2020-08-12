import { Intent, Menu, MenuItem } from '@blueprintjs/core'
import { DecisionTriggerCondition, FormData } from 'botpress/sdk'
import { contextMenu, lang, ShortcutLabel } from 'botpress/shared'
import { FlowView } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { AllPartialNode } from '~/actions'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import ActionContents from '../ActionContents'
import style from '../Components/style.scss'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'
import ExecuteContents from '../ExecuteContents'
import OutcomeContents from '../OutcomeContents'
import PromptContents from '../PromptContents'
import RouterContents from '../RouterContents'
import SaySomethingContents from '../SaySomethingContents'
import SubworkflowContents from '../SubworkflowContents'
import TriggerContents from '../TriggerContents'

interface Props {
  node: BlockModel
  getCurrentFlow: () => FlowView
  updateFlowNode: (props: AllPartialNode) => void
  onDeleteSelectedElements: () => void
  editNodeItem: (node: BlockModel, index: number) => void
  selectedNodeItem: () => { node: BlockModel; index: number }
  getConditions: () => DecisionTriggerCondition[]
  switchFlowNode: (id: string) => void
  addCondition: () => void
  getCurrentLang: () => string
  getExpandedNodes: () => string[]
  setExpanded: (id: string, expanded: boolean) => void
}

const defaultLabels = {
  action: 'studio.flow.node.chatbotExecutes',
  execute: 'studio.flow.node.chatbotExecutes',
  failure: 'studio.flow.node.workflowFails',
  prompt: 'studio.flow.node.chatbotPromptsUser',
  router: 'if',
  say_something: 'studio.flow.node.chatbotSays',
  success: 'studio.flow.node.workflowSucceeds',
  trigger: 'studio.flow.node.triggeredBy',
  'sub-workflow': 'subworkflow'
}

const BlockWidget: FC<Props> = ({
  node,
  getCurrentFlow,
  editNodeItem,
  onDeleteSelectedElements,
  selectedNodeItem,
  updateFlowNode,
  getConditions,
  switchFlowNode,
  addCondition,
  getCurrentLang,
  getExpandedNodes,
  setExpanded
}) => {
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const { nodeType } = node

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
        {nodeType === 'trigger' && (
          <MenuItem
            text={lang.tr('studio.flow.node.addCondition')}
            onClick={() => {
              addCondition()
            }}
          />
        )}
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

  const inputPortInHeader = !['trigger'].includes(nodeType)
  const outPortInHeader = !['failure', 'prompt', 'router', 'success', 'sub-workflow'].includes(nodeType)
  const canCollapse = !['failure', 'prompt', 'router', 'success', 'sub-workflow'].includes(nodeType)
  const hasContextMenu = !['failure', 'success'].includes(nodeType)

  const renderContents = () => {
    switch (nodeType) {
      case 'action':
        return <ActionContents node={node} editNodeItem={editNodeItem} />
      case 'execute':
        return <ExecuteContents node={node} editNodeItem={editNodeItem} />
      case 'prompt':
        return <PromptContents node={node} selectedNodeItem={selectedNodeItem} getCurrentLang={getCurrentLang} />
      case 'router':
        return <RouterContents node={node} />
      case 'success':
        return <OutcomeContents node={node} selectedNodeItem={selectedNodeItem} getCurrentLang={getCurrentLang} />
      case 'failure':
        return <OutcomeContents node={node} selectedNodeItem={selectedNodeItem} getCurrentLang={getCurrentLang} />
      case 'say_something':
        return (
          <SaySomethingContents
            node={node}
            editNodeItem={editNodeItem}
            selectedNodeItem={selectedNodeItem}
            getCurrentLang={getCurrentLang}
          />
        )
      case 'trigger':
        return (
          <TriggerContents
            node={node}
            editNodeItem={editNodeItem}
            selectedNodeItem={selectedNodeItem}
            getConditions={getConditions}
          />
        )
      case 'sub-workflow':
        return (
          <SubworkflowContents
            node={node}
            selectedNodeItem={selectedNodeItem}
            getCurrentLang={getCurrentLang}
            editNodeItem={editNodeItem}
          />
        )
      default:
        return null
    }
  }

  const handleExpanded = expanded => {
    setExpanded(node.id, expanded)
  }

  const expanded = getExpandedNodes().includes(node.id)

  // Prevents moving the node while editing the name so text can be selected
  node.locked = isEditing

  return (
    <NodeWrapper isHighlighed={node.isHighlighted}>
      <NodeHeader
        className={style[nodeType]}
        setExpanded={canCollapse && handleExpanded}
        expanded={canCollapse && expanded}
        handleContextMenu={hasContextMenu && handleContextMenu}
        isEditing={isEditing}
        saveName={saveName}
        defaultLabel={lang.tr(defaultLabels[nodeType])}
        name={node.name}
        type={nodeType}
        error={error}
      >
        {inputPortInHeader && <StandardPortWidget name="in" node={node} className={style.in} />}
        {outPortInHeader && <StandardPortWidget name="out0" node={node} className={style.out} />}
      </NodeHeader>
      {(!canCollapse || expanded) && renderContents()}
    </NodeWrapper>
  )
}

export class BlockModel extends BaseNodeModel {
  public conditions: DecisionTriggerCondition[] = []
  public activeWorkflow: boolean
  public isNew: boolean
  public nodeType: string
  public prompt?
  public contents?: { [lang: string]: FormData }[] = []

  constructor({
    id,
    x,
    y,
    name,
    type,
    prompt,
    contents,
    onEnter = [],
    next = [],
    conditions = [],
    activeWorkflow = false,
    isNew = false,
    isStartNode = false,
    isHighlighted = false
  }) {
    super('block', id)

    this.setData({
      name,
      prompt,
      contents,
      type,
      onEnter,
      next,
      isStartNode,
      isHighlighted,
      conditions,
      activeWorkflow,
      isNew
    })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ conditions = [], activeWorkflow = false, isNew = false, ...data }) {
    super.setData(data as any)

    this.conditions = conditions
    this.activeWorkflow = activeWorkflow
    this.isNew = isNew
    this.nodeType = data.type
    this.prompt = data.prompt
    this.contents = data.contents
  }
}

export class BlockWidgetFactory extends AbstractNodeFactory {
  private editNodeItem: (node: BlockModel, index: number) => void
  private selectedNodeItem: () => { node: BlockModel; index: number }
  private deleteSelectedElements: () => void
  private getConditions: () => DecisionTriggerCondition[]
  private getCurrentFlow: () => FlowView
  private updateFlowNode: (props: AllPartialNode) => void
  private switchFlowNode: (id: string) => void
  private addCondition: () => void
  private getCurrentLang: () => string
  private getExpandedNodes: () => string[]
  private setExpandedNodes: (id: string, expanded: boolean) => void

  constructor(methods) {
    super('block')

    this.editNodeItem = methods.editNodeItem
    this.selectedNodeItem = methods.selectedNodeItem
    this.deleteSelectedElements = methods.deleteSelectedElements
    this.getCurrentFlow = methods.getCurrentFlow
    this.updateFlowNode = methods.updateFlowNode
    this.getConditions = methods.getConditions
    this.switchFlowNode = methods.switchFlowNode
    this.addCondition = methods.addCondition
    this.getCurrentLang = methods.getCurrentLang
    this.getExpandedNodes = methods.getExpandedNodes
    this.setExpandedNodes = methods.setExpandedNodes
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: BlockModel) {
    return (
      <BlockWidget
        node={node}
        getCurrentFlow={this.getCurrentFlow}
        getCurrentLang={this.getCurrentLang}
        editNodeItem={this.editNodeItem}
        onDeleteSelectedElements={this.deleteSelectedElements}
        updateFlowNode={this.updateFlowNode}
        selectedNodeItem={this.selectedNodeItem}
        getConditions={this.getConditions}
        switchFlowNode={this.switchFlowNode}
        addCondition={this.addCondition}
        getExpandedNodes={this.getExpandedNodes}
        setExpanded={this.setExpandedNodes}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new BlockModel()
  }
}
