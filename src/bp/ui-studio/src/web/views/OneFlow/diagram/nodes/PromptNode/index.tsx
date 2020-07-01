import { Intent, Menu, MenuItem } from '@blueprintjs/core'
import { contextMenu, lang, ShortcutLabel } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import {
  StandardIncomingPortModel,
  StandardOutgoingPortModel,
  StandardPortWidget
} from '~/views/FlowBuilder/diagram/nodes/Ports'

import style from '../Components/style.scss'
import NodeHeader from '../Components/NodeHeader'
import NodeWrapper from '../Components/NodeWrapper'

interface Props {
  node: PromptNodeModel
  getCurrentFlow: any
  updateFlowNode: any
  onDeleteSelectedElements: () => void
  editNodeItem: (node: PromptNodeModel, index: number) => void
  selectedNodeItem: () => { node: PromptNodeModel; index: number }
  getCurrentLang: () => string
  switchFlowNode: (id: string) => void
}

const PromptWidget: FC<Props> = ({
  node,
  getCurrentFlow,
  editNodeItem,
  onDeleteSelectedElements,
  selectedNodeItem,
  updateFlowNode,
  getCurrentLang,
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

  const currentLang = getCurrentLang()
  const selectedContent = selectedNodeItem()
  const { next, name } = node || {}
  const { type, params } = node.prompt || {}

  return (
    <NodeWrapper>
      <NodeHeader
        type={node.type}
        className={style.prompt}
        handleContextMenu={handleContextMenu}
        isEditing={isEditing}
        saveName={saveName}
        defaultLabel={lang.tr('studio.flow.node.chatbotPromptsUser')}
        name={name}
        error={error}
      />
      <div className={style.contentsWrapper}>
        <div
          className={cx(style.contentWrapper, {
            [style.active]: selectedContent?.node?.id === node.id
          })}
        >
          <span className={style.content}>{params?.question?.[currentLang]}</span>
        </div>
        <StandardPortWidget name="in" node={node} className={style.in} />
        {next?.map((item, i) => {
          const outputPortName = `out${i}`
          return (
            <div key={`${i}.${item}`} className={style.contentWrapper}>
              <div className={cx(style.content, style.promptPortContent)}>
                {item.caption}
                <StandardPortWidget name={outputPortName} node={node} className={style.outRouting} />
              </div>
            </div>
          )
        })}
      </div>
    </NodeWrapper>
  )
}

export class PromptNodeModel extends BaseNodeModel {
  public prompt?

  constructor({ id, x, y, name, next = [], prompt, isStartNode = false, isHighlighted = false }) {
    super('prompt', id)

    this.setData({ name, next, isStartNode, prompt, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  serialize() {
    return _.merge(super.serialize(), {
      name: this.name,
      next: this.next
    })
  }

  deSerialize(data, engine) {
    super.deSerialize(data, engine)

    this.setData(data)
  }

  setData({ name, next = [], isStartNode, prompt, isHighlighted }) {
    this.isStartNode = isStartNode
    this.isHighlighted = isHighlighted
    const inNodeType = isStartNode ? 'start' : 'normal'

    if (!this.ports['in']) {
      this.addPort(new StandardIncomingPortModel('in', inNodeType))
    }

    // We create as many output port as needed
    for (let i = 0; i < next.length; i++) {
      if (!this.ports['out' + i]) {
        this.addPort(new StandardOutgoingPortModel('out' + i))
      }
    }

    if (!_.isArray(next) && _.isObjectLike(next)) {
      next = [next]
    }

    this.prompt = prompt
    this.next = next
    this.name = name
  }
}

export class PromptWidgetFactory extends AbstractNodeFactory {
  private editNodeItem: (node: PromptNodeModel, index: number) => void
  private selectedNodeItem: () => { node: PromptNodeModel; index: number }
  private deleteSelectedElements: () => void
  private getCurrentLang: () => string
  private getCurrentFlow: any
  private updateFlowNode: any
  private switchFlowNode: (id: string) => void

  constructor(methods) {
    super('prompt')

    this.editNodeItem = methods.editNodeItem
    this.selectedNodeItem = methods.selectedNodeItem
    this.deleteSelectedElements = methods.deleteSelectedElements
    this.getCurrentFlow = methods.getCurrentFlow
    this.updateFlowNode = methods.updateFlowNode
    this.getCurrentLang = methods.getCurrentLang
    this.switchFlowNode = methods.switchFlowNode
  }

  generateReactWidget(diagramEngine, node) {
    return (
      <PromptWidget
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
    return new PromptNodeModel()
  }
}
