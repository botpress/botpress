import { Intent, Menu, MenuDivider, MenuItem } from '@blueprintjs/core'
import { DecisionTriggerCondition, Flow, FormData } from 'botpress/sdk'
import { contextMenu, lang, sharedStyle, ShortcutLabel, toast } from 'botpress/shared'
import { FlowView } from 'common/typings'
import React, { FC } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { NodeDebugInfo } from '../../debugger'
import { defaultTransition } from '../../manager'
import ActionContents from '../ActionContents'
import style from '../Components/style.scss'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'
import ExecuteContents from '../ExecuteContents'
import RouterContents from '../RouterContents'
import SaySomethingContents from '../SaySomethingContents'
import TriggerContents from '../TriggerContents'

interface Props {
  node: BlockModel
  getCurrentFlow: () => FlowView
  onDeleteSelectedElements: () => void
  onCopySelectedElement: (nodeId: string) => void
  editNodeItem: (node: BlockModel, index: number) => void
  editTriggers: (node: BlockModel) => void
  disconnectNode: (node: BlockModel) => void
  selectedNodeItem: () => { node: BlockModel; index: number }
  getConditions: () => DecisionTriggerCondition[]
  switchFlowNode: (id: string) => void
  addCondition: (nodeType: string) => void
  addMessage: () => void
  getLanguage?: () => { currentLang: string; defaultLang: string }
  getExpandedNodes: () => string[]
  setExpanded: (id: string, expanded: boolean) => void
  getDebugInfo: (nodeName: string) => NodeDebugInfo
  getFlows: () => Flow[]
  updateFlowNode: (args: any) => void
}

const defaultLabels = {
  action: 'studio.flow.node.chatbotExecutes',
  execute: 'studio.flow.node.chatbotExecutes',
  failure: 'studio.flow.node.workflowFails',
  router: 'if',
  listen: 'listen',
  say_something: 'studio.flow.node.chatbotSays',
  success: 'studio.flow.node.workflowSucceeds',
  trigger: 'studio.flow.node.triggeredBy'
}

const BlockWidget: FC<Props> = ({
  node,
  editNodeItem,
  onDeleteSelectedElements,
  onCopySelectedElement,
  selectedNodeItem,
  getConditions,
  switchFlowNode,
  updateFlowNode,
  getLanguage,
  getExpandedNodes,
  setExpanded,
  getDebugInfo,
  editTriggers,
  disconnectNode
}) => {
  const { nodeType } = node
  const { currentLang, defaultLang } = getLanguage()

  const handleContextMenu = e => {
    e.stopPropagation()
    e.preventDefault()

    if (defaultLang && defaultLang !== currentLang) {
      toast.info('studio.flow.cannotAddContent')
      return
    }

    switchFlowNode(node.id)
    contextMenu(
      e,
      <Menu>
        <MenuItem
          icon="trash"
          text={
            <div className={sharedStyle.contextMenuLabel}>
              {lang.tr('delete')}
              <ShortcutLabel light keys={['backspace']} />
            </div>
          }
          intent={Intent.DANGER}
          onClick={onDeleteSelectedElements}
        />
        <MenuItem
          icon="duplicate"
          text={<div className={sharedStyle.contextMenuLabel}>{lang.tr('copy')}</div>}
          onClick={() => onCopySelectedElement(node.id)}
        />
        <MenuDivider />
        {nodeType === 'trigger' && <MenuItem icon="edit" text={lang.tr('edit')} onClick={() => editTriggers(node)} />}
        <MenuItem icon="minimize" text={lang.tr('studio.flow.disconnectNode')} onClick={() => disconnectNode(node)} />
        {nodeType === 'router' ? (
          <React.Fragment>
            <MenuDivider />
            <MenuItem text={lang.tr('studio.flow.chips')}>
              <MenuItem
                text={lang.tr('studio.flow.transition')}
                onClick={async () => {
                  await switchFlowNode(node.id)
                  updateFlowNode({ next: [...node.next, defaultTransition] })
                }}
                icon="flow-end"
              />
            </MenuItem>
          </React.Fragment>
        ) : null}
      </Menu>
    )
  }

  const inputPortInHeader = !['trigger'].includes(nodeType)
  const outPortInHeader = !['failure', 'router', 'success'].includes(nodeType)
  const canCollapse = !['failure', 'router', 'success', 'listen'].includes(nodeType)
  const hasContextMenu = !['failure', 'success'].includes(nodeType)

  const debugInfo = getDebugInfo(node.name)

  const renderContents = () => {
    switch (nodeType) {
      case 'action':
        return <ActionContents node={node} editNodeItem={editNodeItem} />
      case 'execute':
        return <ExecuteContents node={node} updateFlowNode={updateFlowNode} switchFlowNode={switchFlowNode} />
      case 'router':
        return <RouterContents node={node} editNodeItem={editNodeItem} selectedNodeItem={selectedNodeItem} />
      case 'say_something':
        return (
          <SaySomethingContents
            node={node}
            content={node.content}
            defaultLang={defaultLang}
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
  public content?: FormData
  public flow: string

  constructor({
    id,
    x,
    y,
    name,
    type,
    flow,
    content,
    onEnter = [],
    next = [],
    conditions = [],
    activeWorkflow = false,
    isNew = false,
    isStartNode = false,
    isHighlighted = false,
    isReadOnly = false
  }) {
    super('block', id)

    this.setData({
      name,
      content,
      type,
      onEnter,
      next,
      flow,
      isStartNode,
      isHighlighted,
      conditions,
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
    this.content = data.content
    this.flow = data.flow
    this.isReadOnly = data.isReadOnly
  }
}

export class BlockWidgetFactory extends AbstractNodeFactory {
  private editNodeItem: (node: BlockModel, index: number) => void
  private selectedNodeItem: () => { node: BlockModel; index: number }
  private deleteSelectedElements: () => void
  private copySelectedElement: (nodeId: string) => void
  private getConditions: () => DecisionTriggerCondition[]
  private getCurrentFlow: () => FlowView
  private switchFlowNode: (id: string) => void
  private addCondition: (nodeType: string) => void
  private addMessage: () => void
  private getLanguage: () => { currentLang: string; defaultLang: string }
  private getExpandedNodes: () => string[]
  private setExpandedNodes: (id: string, expanded: boolean) => void
  private getDebugInfo: (nodeName: string) => NodeDebugInfo
  private getFlows: () => Flow[]
  private updateFlowNode: (args: any) => void
  private editTriggers: (node: BlockModel) => void
  private disconnectNode: (node: BlockModel) => void

  constructor(methods) {
    super('block')

    this.editNodeItem = methods.editNodeItem
    this.selectedNodeItem = methods.selectedNodeItem
    this.deleteSelectedElements = methods.deleteSelectedElements
    this.copySelectedElement = methods.copySelectedElement
    this.getCurrentFlow = methods.getCurrentFlow
    this.getConditions = methods.getConditions
    this.switchFlowNode = methods.switchFlowNode
    this.addCondition = methods.addCondition
    this.addMessage = methods.addMessage
    this.getLanguage = methods.getLanguage
    this.getExpandedNodes = methods.getExpandedNodes
    this.setExpandedNodes = methods.setExpandedNodes
    this.getDebugInfo = methods.getDebugInfo
    this.getFlows = methods.getFlows
    this.updateFlowNode = methods.updateFlowNode
    this.editTriggers = methods.editTriggers
    this.disconnectNode = methods.disconnectNode
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: BlockModel) {
    return (
      <BlockWidget
        node={node}
        getCurrentFlow={this.getCurrentFlow}
        getLanguage={this.getLanguage}
        editNodeItem={this.editNodeItem}
        onDeleteSelectedElements={this.deleteSelectedElements}
        onCopySelectedElement={this.copySelectedElement}
        selectedNodeItem={this.selectedNodeItem}
        getConditions={this.getConditions}
        switchFlowNode={this.switchFlowNode}
        updateFlowNode={this.updateFlowNode}
        addCondition={this.addCondition}
        addMessage={this.addMessage}
        getExpandedNodes={this.getExpandedNodes}
        setExpanded={this.setExpandedNodes}
        getDebugInfo={this.getDebugInfo}
        getFlows={this.getFlows}
        editTriggers={this.editTriggers}
        disconnectNode={this.disconnectNode}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new BlockModel()
  }
}
