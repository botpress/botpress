import { Button, Menu, MenuItem } from '@blueprintjs/core'
import { Contents, contextMenu, lang } from 'botpress/shared'
import { FormData } from 'common/typings'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import style from './style.scss'

interface Props {
  node: SaySomethingNodeModel
  editContent: (node: SaySomethingNodeModel, index: number) => void
  selectedNodeContent: () => { node: SaySomethingNodeModel; index: number }
}

const SaySomethingWidget: FC<Props> = ({ node, editContent, selectedNodeContent }) => {
  const [expanded, setExpanded] = useState(node.isNew)

  const handleContextMenu = e => {
    console.log(e.currentTarget.getBoundingClientRect())
    e.stopPropagation()
    e.preventDefault()
    contextMenu(
      e,
      <Menu>
        <MenuItem text={lang.tr('studio.flow.node.renameBlock')} onClick={() => console.log('delete')} />
        <MenuItem text={lang.tr('delete')} onClick={() => console.log('delete')} />
      </Menu>
    )
  }

  const selectedContent = selectedNodeContent()

  return (
    <div
      className={style.nodeWrapper}
      onContextMenu={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
    >
      <Button
        icon={expanded ? 'chevron-down' : 'chevron-right'}
        onClick={() => setExpanded(!expanded)}
        className={style.blockHeader}
        onContextMenu={handleContextMenu}
      >
        {lang.tr('studio.flow.node.chatbotSays')}
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </Button>
      {expanded && (
        <div className={style.contentsWrapper}>
          {node.contents?.map((content, index) => (
            <Contents.Item
              active={selectedContent?.node?.id === node.id && index === selectedContent?.index}
              key={index}
              onEdit={() => editContent?.(node, index)}
              content={content}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export class SaySomethingNodeModel extends BaseNodeModel {
  public contents: FormData[] = []
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

  constructor(
    editContent: (node, index) => void,
    selectedNodeContent: () => { node: SaySomethingNodeModel; index: number }
  ) {
    super('say_something')

    this.editContent = editContent
    this.selectedNodeContent = selectedNodeContent
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: SaySomethingNodeModel) {
    return (
      <SaySomethingWidget node={node} editContent={this.editContent} selectedNodeContent={this.selectedNodeContent} />
    )
  }

  getNewInstance() {
    // @ts-ignore
    return new SaySomethingNodeModel()
  }
}
