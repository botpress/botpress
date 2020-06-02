import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { FormData } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useState } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'
import { showHeader } from '~/views/FlowBuilder/diagram/nodes_v2/utils'

import { BaseNodeModel } from '../../../../FlowBuilder/diagram/nodes/BaseNodeModel'

import style from './style.scss'
import SayContent from './SayContent'

interface Props {
  node: BlockNodeModel
  editContent: (node, index) => void
}

const BlockWidget: FC<Props> = ({ node, editContent }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={style.nodeWrapper}>
      <Button
        icon={expanded ? 'chevron-down' : 'chevron-right'}
        onClick={() => setExpanded(!expanded)}
        className={style.blockHeader}
      >
        {lang.tr('studio.flow.node.chatbotSays')}
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </Button>
      {expanded && (
        <div className={style.contentsWrapper}>
          {node.contents?.map((content, index) => (
            <SayContent
              key={index}
              onClick={() => editContent?.(node, index)}
              content={content}
              contentType={content.contentType}
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

  constructor(editContent: (node, index) => void) {
    super('block')

    this.editContent = editContent
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: BlockNodeModel) {
    return <BlockWidget node={node} editContent={this.editContent} />
  }

  getNewInstance() {
    // @ts-ignore
    return new BlockNodeModel()
  }
}
