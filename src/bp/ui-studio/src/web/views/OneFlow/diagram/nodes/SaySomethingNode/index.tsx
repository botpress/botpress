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
  editContent: (node: SaySomethingNodeModel, index: number) => void
  selectedNodeContent: () => { node: SaySomethingNodeModel; index: number }
  getCurrentLang: () => string
  switchFlowNode: (id: string) => void
}

const SaySomethingWidget: FC<Props> = ({
  node,
  getCurrentFlow,
  editContent,
  onDeleteSelectedElements,
  selectedNodeContent,
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

  const selectedContent = selectedNodeContent()

  const getTranslatedContent = content => {
    const langArr = Object.keys(content)
    if (!langArr.length) {
      return {}
    }

    if (!langArr.includes(currentLang)) {
      return { contentType: content[langArr[0]].contentType }
    }

    return content[currentLang]
  }

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
              onEdit={() => editContent?.(node, index)}
              content={getTranslatedContent(content)}
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
  private editContent: (node: SaySomethingNodeModel, index: number) => void
  private selectedNodeContent: () => { node: SaySomethingNodeModel; index: number }
  private deleteSelectedElements: () => void
  private getCurrentLang: () => string
  private getCurrentFlow: any
  private updateFlowNode: any
  private switchFlowNode: (id: string) => void

  constructor(methods) {
    super('say_something')

    this.editContent = methods.editContent
    this.selectedNodeContent = methods.selectedNodeContent
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
        editContent={this.editContent}
        onDeleteSelectedElements={this.deleteSelectedElements}
        updateFlowNode={this.updateFlowNode}
        selectedNodeContent={this.selectedNodeContent}
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
