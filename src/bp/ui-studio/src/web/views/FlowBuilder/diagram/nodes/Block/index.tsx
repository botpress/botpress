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
import SkillCallContents, { SkillDefinition } from '../SkillCallContents'
import StandardContents from '../StandardContents'
import TriggerContents from '../TriggerContents'

export interface BlockProps {
  node: BlockModel
  getCurrentFlow: () => FlowView
  deleteSelectedElements: () => void
  copySelectedElement: (nodeId: string) => void
  editNodeItem: (node: BlockModel, index: number) => void
  editTriggers: (node: BlockModel) => void
  disconnectNode: (node: BlockModel) => void
  selectedNodeItem: () => { node: BlockModel; index: number }
  getConditions: () => DecisionTriggerCondition & { label: string; id: string }[]
  switchFlowNode: (id: string) => void
  getLanguage?: () => { currentLang: string; defaultLang: string }
  getExpandedNodes: () => string[]
  setExpandedNodes: (id: string, expanded: boolean) => void
  getDebugInfo: (nodeName: string) => NodeDebugInfo
  getFlows: () => Flow[]
  updateFlowNode: (args: any) => void
  updateFlow: (args: any) => void
  getSkills: () => SkillDefinition[]
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

const BlockWidget: FC<BlockProps> = ({
  node,
  editNodeItem,
  deleteSelectedElements,
  copySelectedElement,
  selectedNodeItem,
  getConditions,
  switchFlowNode,
  updateFlowNode,
  getCurrentFlow,
  updateFlow,
  getLanguage,
  getExpandedNodes,
  setExpandedNodes,
  getDebugInfo,
  editTriggers,
  disconnectNode,
  getSkills
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

    const canMakeStartNode = () => {
      const current = getCurrentFlow().startNode
      return current && node.name && current !== node.name
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
          onClick={deleteSelectedElements}
        />
        <MenuItem
          icon="duplicate"
          text={<div className={sharedStyle.contextMenuLabel}>{lang.tr('copy')}</div>}
          onClick={() => copySelectedElement(node.id)}
        />
        <MenuDivider />
        {nodeType === 'trigger' && <MenuItem icon="edit" text={lang.tr('edit')} onClick={() => editTriggers(node)} />}
        <MenuItem
          icon="star"
          text={lang.tr('studio.flow.setAsStart')}
          disabled={!canMakeStartNode()}
          onClick={() => updateFlow({ startNode: node.name })}
        />
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
  const outPortInHeader = !['failure', 'router', 'success', 'standard', 'skill-call'].includes(nodeType)
  const canCollapse = !['failure', 'router', 'success', 'listen', 'standard', 'skill-call'].includes(nodeType)
  const hasContextMenu = !['failure', 'success'].includes(nodeType)

  const debugInfo = getDebugInfo(node.name)

  const renderContents = () => {
    switch (nodeType) {
      case 'action':
        return <ActionContents node={node} editNodeItem={editNodeItem} />
      case 'execute':
        return (
          <ExecuteContents
            node={node}
            editNodeItem={editNodeItem}
            updateFlowNode={updateFlowNode}
            switchFlowNode={switchFlowNode}
          />
        )
      case 'router':
        return <RouterContents node={node} editNodeItem={editNodeItem} />
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
      case 'skill-call':
        return <SkillCallContents node={node} />
      default:
        return <StandardContents node={node} />
    }
  }

  const handleExpanded = expanded => {
    setExpandedNodes(node.id, expanded)
  }

  const expanded = getExpandedNodes().includes(node.id)

  // Larger node size because they have a lot of content and it looks too cramped
  const isOldNode = ['standard', 'skill-call'].includes(nodeType)

  let label = lang.tr(defaultLabels[nodeType])
  if (isOldNode) {
    label =
      nodeType === 'skill-call'
        ? `${lang.tr(getSkills()?.find(x => x.id === node.skill)?.name) || ''} | ${node.name}`
        : node.name
  }

  return (
    <NodeWrapper isHighlighed={node.isHighlighted || node.isSelected()} isLarge={isOldNode}>
      <NodeHeader
        className={style[nodeType]}
        setExpanded={canCollapse && handleExpanded}
        expanded={canCollapse && expanded}
        handleContextMenu={!node.isReadOnly && hasContextMenu && handleContextMenu}
        defaultLabel={label}
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
  public skill?: string

  constructor({
    id,
    x,
    y,
    name,
    type,
    flow,
    skill,
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
      skill,
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
    this.nodeType = data.type || 'standard'
    this.content = data.content
    this.flow = data.flow
    this.skill = data.skill
    this.isReadOnly = data.isReadOnly
  }
}

export class BlockWidgetFactory extends AbstractNodeFactory {
  private editNodeItem: BlockProps['editNodeItem']
  private selectedNodeItem: BlockProps['selectedNodeItem']
  private deleteSelectedElements: BlockProps['deleteSelectedElements']
  private copySelectedElement: BlockProps['copySelectedElement']
  private getConditions: BlockProps['getConditions']
  private getCurrentFlow: BlockProps['getCurrentFlow']
  private switchFlowNode: BlockProps['switchFlowNode']
  private getLanguage: BlockProps['getLanguage']
  private getExpandedNodes: BlockProps['getExpandedNodes']
  private setExpandedNodes: BlockProps['setExpandedNodes']
  private getDebugInfo: BlockProps['getDebugInfo']
  private getFlows: BlockProps['getFlows']
  private updateFlowNode: BlockProps['updateFlowNode']
  private editTriggers: BlockProps['editTriggers']
  private disconnectNode: BlockProps['disconnectNode']
  private updateFlow: BlockProps['updateFlow']
  private getSkills: BlockProps['getSkills']

  constructor(methods: BlockProps) {
    super('block')

    this.editNodeItem = methods.editNodeItem
    this.selectedNodeItem = methods.selectedNodeItem
    this.deleteSelectedElements = methods.deleteSelectedElements
    this.copySelectedElement = methods.copySelectedElement
    this.getCurrentFlow = methods.getCurrentFlow
    this.getConditions = methods.getConditions
    this.switchFlowNode = methods.switchFlowNode
    this.getLanguage = methods.getLanguage
    this.getExpandedNodes = methods.getExpandedNodes
    this.setExpandedNodes = methods.setExpandedNodes
    this.getDebugInfo = methods.getDebugInfo
    this.getFlows = methods.getFlows
    this.updateFlowNode = methods.updateFlowNode
    this.editTriggers = methods.editTriggers
    this.disconnectNode = methods.disconnectNode
    this.updateFlow = methods.updateFlow
    this.getSkills = methods.getSkills
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: BlockModel) {
    return (
      <BlockWidget
        node={node}
        getCurrentFlow={this.getCurrentFlow}
        getLanguage={this.getLanguage}
        editNodeItem={this.editNodeItem}
        deleteSelectedElements={this.deleteSelectedElements}
        copySelectedElement={this.copySelectedElement}
        selectedNodeItem={this.selectedNodeItem}
        getConditions={this.getConditions}
        switchFlowNode={this.switchFlowNode}
        updateFlowNode={this.updateFlowNode}
        getExpandedNodes={this.getExpandedNodes}
        setExpandedNodes={this.setExpandedNodes}
        getDebugInfo={this.getDebugInfo}
        getFlows={this.getFlows}
        editTriggers={this.editTriggers}
        disconnectNode={this.disconnectNode}
        updateFlow={this.updateFlow}
        getSkills={this.getSkills}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new BlockModel()
  }
}
