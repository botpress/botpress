import { Button, ContextMenu, Menu, MenuItem } from '@blueprintjs/core'
import { Contents, lang } from 'botpress/shared'
import { FormData } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { BaseNodeModel } from '../../../../FlowBuilder/diagram/nodes/BaseNodeModel'

import style from './style.scss'

interface Props {
  node: BlockNodeModel
  editContent: (node, index) => void
  isContentSelected: (node, index) => boolean
}

const BlockWidget: FC<Props> = ({ node, editContent, isContentSelected }) => {
  const [expanded, setExpanded] = useState(false)

  const handleContextMenu = e => {
    console.log(e.currentTarget.getBoundingClientRect())
    e.stopPropagation()
    e.preventDefault()
    ContextMenu.show(
      <Menu>
        <MenuItem text={lang.tr('studio.content.renameBlock')} onClick={() => console.log('delete')} />
        <MenuItem text={lang.tr('delete')} onClick={() => console.log('delete')} />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

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
              active={isContentSelected(node, index)}
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

export class BlockNodeModel extends BaseNodeModel {
  public contents: FormData[] = []
  public blockType: string

  constructor({
    id,
    x,
    y,
    name,
    onEnter = [],
    next = [],
    contents,
    blockType,
    isStartNode = false,
    isHighlighted = false
  }) {
    super('block', id)
    this.setData({ name, onEnter, next, contents, blockType, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ contents, blockType, ...data }: any) {
    this.contents = contents
    this.blockType = blockType

    super.setData(data as any)
  }
}

export class BlockWidgetFactory extends AbstractNodeFactory {
  private editContent: (node, index) => void
  private isContentSelected: (node, index) => boolean

  constructor(editContent, isContentSelected) {
    super('block')

    this.editContent = editContent
    this.isContentSelected = isContentSelected
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: BlockNodeModel) {
    return <BlockWidget node={node} editContent={this.editContent} isContentSelected={this.isContentSelected} />
  }

  getNewInstance() {
    // @ts-ignore
    return new BlockNodeModel()
  }
}
