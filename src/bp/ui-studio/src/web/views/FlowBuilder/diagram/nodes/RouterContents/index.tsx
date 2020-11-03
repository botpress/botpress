import cx from 'classnames'
import React, { FC } from 'react'
import RoutingItem from '~/views/FlowBuilder/common/routing'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'
import NodeContentItem from '../Components/NodeContentItem'

interface Props {
  node: BlockModel
  selectedNodeItem: () => { node: BlockModel; index: number }
  editNodeItem: (node: BlockModel, index: number) => void
}

const RouterContents: FC<Props> = ({ node, editNodeItem, selectedNodeItem }) => {
  const selectedContent = selectedNodeItem()

  return (
    <div className={style.contentsWrapper}>
      {(node?.next || []).map((item, i) => (
        <NodeContentItem
          onEdit={() => (i === node.next.length - 1 ? {} : editNodeItem?.(node, i))}
          className={cx({
            [style.active]: selectedContent?.node?.id === node.id && i === selectedContent?.index
          })}
          key={i}
        >
          <div className={style.content}>
            <RoutingItem condition={item} position={i} />
            <StandardPortWidget name={`out${i}`} node={node} className={cx(style.outRouting, 'if-else')} />
          </div>
        </NodeContentItem>
      ))}
    </div>
  )
}

export default RouterContents
