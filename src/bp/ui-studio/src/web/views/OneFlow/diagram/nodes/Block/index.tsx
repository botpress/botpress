import { Intent, Menu, MenuItem } from '@blueprintjs/core'
import { DecisionTriggerCondition, FormData, SubWorkflowNode } from 'botpress/sdk'
import { contextMenu, lang, ShortcutLabel } from 'botpress/shared'
import { FlowView } from 'common/typings'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { AllPartialNode } from '~/actions'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { NodeDebugInfo } from '../../debugger'
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
  addCondition: (nodeType: string) => void
  addMessage: () => void
  getLanguage?: () => { currentLang: string; defaultLang: string }
  getExpandedNodes: () => string[]
  setExpanded: (id: string, expanded: boolean) => void
  getDebugInfo: (nodeName: string) => NodeDebugInfo
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
  'sub-workflow': 'studio.flow.node.subworkflow'
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
  addMessage,
  getLanguage,
  getExpandedNodes,
  setExpanded,
  getDebugInfo
}) => {
  const { nodeType } = node

  const handleContextMenu = e => {
    e.stopPropagation()
    e.preventDefault()
    switchFlowNode(node.id)
    contextMenu(
      e,
      <Menu>
        {(nodeType === 'trigger' || nodeType === 'router') && (
          <MenuItem
            text={lang.tr('studio.flow.node.addCondition')}
            onClick={() => {
              addCondition(nodeType)
            }}
          />
        )}
        {nodeType === 'say_something' && (
          <MenuItem
            text={lang.tr('studio.flow.node.addMessage')}
            onClick={() => {
              addMessage()
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

  const inputPortInHeader = !['trigger'].includes(nodeType)
  const outPortInHeader = !['failure', 'prompt', 'router', 'success', 'sub-workflow'].includes(nodeType)
  const canCollapse = !['failure', 'prompt', 'router', 'success', 'sub-workflow'].includes(nodeType)
  const hasContextMenu = !['failure', 'success'].includes(nodeType)
  const { currentLang, defaultLang } = getLanguage()
  const debugInfo = getDebugInfo(node.name)

  const renderContents = () => {
    switch (nodeType) {
      case 'action':
        return <ActionContents node={node} editNodeItem={editNodeItem} />
      case 'execute':
        return <ExecuteContents node={node} editNodeItem={editNodeItem} />
      case 'prompt':
        return (
          <PromptContents
            node={node}
            selectedNodeItem={selectedNodeItem}
            defaultLang={defaultLang}
            currentLang={currentLang}
          />
        )
      case 'router':
        return <RouterContents node={node} editNodeItem={editNodeItem} selectedNodeItem={selectedNodeItem} />
      case 'say_something':
        return (
          <SaySomethingContents
            node={node}
            defaultLang={defaultLang}
            editNodeItem={editNodeItem}
            selectedNodeItem={selectedNodeItem}
            currentLang={currentLang}
          />
        )
      case 'trigger':
        return (
          <TriggerContents
            node={node}
            defaultLang={defaultLang}
            editNodeItem={editNodeItem}
            selectedNodeItem={selectedNodeItem}
            getConditions={getConditions}
            currentLang={currentLang}
          />
        )
      case 'sub-workflow':
        return <SubworkflowContents node={node} selectedNodeItem={selectedNodeItem} editNodeItem={editNodeItem} />
      default:
        return null
    }
  }

  const handleExpanded = expanded => {
    setExpanded(node.id, expanded)
  }

  const expanded = getExpandedNodes().includes(node.id)

  return (
    <NodeWrapper isHighlighed={node.isHighlighted || node.isSelected()}>
      <NodeHeader
        className={style[nodeType]}
        setExpanded={canCollapse && handleExpanded}
        expanded={canCollapse && expanded}
        handleContextMenu={!node.isReadOnly && hasContextMenu && handleContextMenu}
        defaultLabel={lang.tr(defaultLabels[nodeType])}
        debugInfo={debugInfo}
        nodeType={nodeType}
      >
        <StandardPortWidget hidden={!inputPortInHeader} name="in" node={node} className={style.in} />
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
  public isReadOnly: boolean
  public nodeType: string
  public prompt?
  public contents?: FormData[] = []
  public subflow: SubWorkflowNode

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
    subflow = {},
    activeWorkflow = false,
    isNew = false,
    isStartNode = false,
    isHighlighted = false,
    isReadOnly = false
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
      subflow,
      activeWorkflow,
      isNew,
      isReadOnly
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
    this.subflow = data.subflow
    this.isReadOnly = data.isReadOnly
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
  private addCondition: (nodeType: string) => void
  private addMessage: () => void
  private getLanguage: () => { currentLang: string; defaultLang: string }
  private getExpandedNodes: () => string[]
  private setExpandedNodes: (id: string, expanded: boolean) => void
  private getDebugInfo: (nodeName: string) => NodeDebugInfo

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
    this.addMessage = methods.addMessage
    this.getLanguage = methods.getLanguage
    this.getExpandedNodes = methods.getExpandedNodes
    this.setExpandedNodes = methods.setExpandedNodes
    this.getDebugInfo = methods.getDebugInfo
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: BlockModel) {
    return (
      <BlockWidget
        node={node}
        getCurrentFlow={this.getCurrentFlow}
        getLanguage={this.getLanguage}
        editNodeItem={this.editNodeItem}
        onDeleteSelectedElements={this.deleteSelectedElements}
        updateFlowNode={this.updateFlowNode}
        selectedNodeItem={this.selectedNodeItem}
        getConditions={this.getConditions}
        switchFlowNode={this.switchFlowNode}
        addCondition={this.addCondition}
        addMessage={this.addMessage}
        getExpandedNodes={this.getExpandedNodes}
        setExpanded={this.setExpandedNodes}
        getDebugInfo={this.getDebugInfo}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new BlockModel()
  }
}
