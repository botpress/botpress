import { FormData } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'
import { showHeader } from '~/views/FlowBuilder/diagram/nodes_v2/utils'

import { BaseNodeModel } from '../../../../FlowBuilder/diagram/nodes/BaseNodeModel'

import style from './style.scss'
import SayContent from './SayContent'

interface Props {
  node: BlockNodeModel
  diagramEngine: any
}

const BlockWidget: FC<Props> = ({ node, diagramEngine }) => {
  return (
    <Fragment>
      <div className={style.nodeWrapper}>
        {showHeader({ nodeType: 'Say', nodeName: node.name, isStartNode: node.isStartNode })}
        <div className={style.content}>
          {node.contents?.map((content, index) => (
            <SayContent
              key={index}
              node={node}
              onClick={() => node.editContent?.(node, index)}
              data={content.formData}
              contentType={content.contentType}
            />
          ))}
        </div>
        <div className={style.ports}>
          <StandardPortWidget name="in" node={node} className={style.in} />
          <StandardPortWidget name="out0" node={node} className={style.out} />
        </div>
      </div>
    </Fragment>
  )
}

export class BlockNodeModel extends BaseNodeModel {
  public contents: FormData[] = []
  public editContent: (node, index) => void

  constructor({
    id,
    x,
    y,
    name,
    onEnter = [],
    next = [],
    contents,
    editContent,
    isStartNode = false,
    isHighlighted = false
  }) {
    super('block', id)
    this.setData({ name, onEnter, next, contents, editContent, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ contents, editContent, ...data }: any) {
    this.contents = contents
    this.editContent = editContent
    console.log(editContent)

    super.setData(data as any)
  }
}

export class BlockWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('block')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: BlockNodeModel) {
    return <BlockWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new BlockNodeModel()
  }
}
