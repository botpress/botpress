import { Button, Icon, Intent, Menu, MenuItem, Tooltip } from '@blueprintjs/core'
import { FormData } from 'botpress/sdk'
import { Contents, contextMenu, lang, ShortcutLabel } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import style from '../Components/style.scss'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'

interface Props {
  node: SaySomethingNodeModel
  getCurrentFlow: any
  updateFlowNode: any
  onDeleteSelectedElements: () => void
  editNodeItem: (node: SaySomethingNodeModel, index: number) => void
  selectedNodeItem: () => { node: SaySomethingNodeModel; index: number }
  getCurrentLang: () => string
  switchFlowNode: (id: string) => void
}

const SaySomethingWidget: FC<Props> = ({
  node,
  getCurrentFlow,
  editNodeItem,
  onDeleteSelectedElements,
  selectedNodeItem,
  updateFlowNode,
  getCurrentLang,
  switchFlowNode
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
  const currentLang = getCurrentLang()

  const selectedContent = selectedNodeItem()

  // Prevents moving the node while editing the name so text can be selected
  node.locked = isEditing

  return (
    <NodeWrapper>
      <NodeHeader
        setExpanded={setExpanded}
        expanded={expanded}
        handleContextMenu={handleContextMenu}
        isEditing={isEditing}
        saveName={saveName}
        defaultLabel={lang.tr('studio.flow.node.chatbotSays')}
        name={node.name}
        type={node.type}
        error={error}
      >
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </NodeHeader>
      {expanded && (
        <div className={style.contentsWrapper}>
          {node.contents?.map((content, index) => (
            <Contents.Item
              active={selectedContent?.node?.id === node.id && index === selectedContent?.index}
              key={`${index}${currentLang}`}
              onEdit={() => editNodeItem?.(node, index)}
              contentLang={getCurrentLang()}
              content={content}
            />
          ))}
        </div>
      )}
    </NodeWrapper>
  )
}

export class SaySomethingNodeModel extends BaseNodeModel {
  public contents: { [lang: string]: FormData }[] = []
  public isNew: boolean

  constructor({
    id,
    x,
    y,
    name,
    onEnter = [],
    next = [],
    contents,
    isNew,
    isStartNode = false,
    isHighlighted = false
  }) {
    super('say_something', id)
    this.setData({ name, onEnter, next, isNew, contents, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ contents, isNew, ...data }: any) {
    this.contents = contents
    this.isNew = isNew

    super.setData(data as any)
  }
}

export class SaySomethingWidgetFactory extends AbstractNodeFactory {
  private editNodeItem: (node: SaySomethingNodeModel, index: number) => void
  private selectedNodeItem: () => { node: SaySomethingNodeModel; index: number }
  private deleteSelectedElements: () => void
  private getCurrentLang: () => string
  private getCurrentFlow: any
  private updateFlowNode: any
  private switchFlowNode: (id: string) => void

  constructor(methods) {
    super('say_something')

    this.editNodeItem = methods.editNodeItem
    this.selectedNodeItem = methods.selectedNodeItem
    this.deleteSelectedElements = methods.deleteSelectedElements
    this.getCurrentFlow = methods.getCurrentFlow
    this.updateFlowNode = methods.updateFlowNode
    this.getCurrentLang = methods.getCurrentLang
    this.switchFlowNode = methods.switchFlowNode
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: SaySomethingNodeModel) {
    return (
      <SaySomethingWidget
        node={node}
        getCurrentFlow={this.getCurrentFlow}
        editNodeItem={this.editNodeItem}
        onDeleteSelectedElements={this.deleteSelectedElements}
        updateFlowNode={this.updateFlowNode}
        selectedNodeItem={this.selectedNodeItem}
        getCurrentLang={this.getCurrentLang}
        switchFlowNode={this.switchFlowNode}
      />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new SaySomethingNodeModel()
  }
}
