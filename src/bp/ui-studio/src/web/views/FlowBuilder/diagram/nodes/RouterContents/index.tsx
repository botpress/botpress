import cx from 'classnames'
import React, { FC } from 'react'
import RoutingItem from '~/views/FlowBuilder/common/routing'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { BlockProps } from '../Block'
import style from '../Components/style.scss'
import NodeContentItem from '../Components/NodeContentItem'

type Props = Pick<BlockProps, 'node' | 'editNodeItem'>

const RouterContents: FC<Props> = ({ node, editNodeItem }) => {
  return (
    <div className={cx(style.contentsWrapper, style.router)}>
      {(node?.next || []).map((item, i) => (
        <NodeContentItem onEdit={() => editNodeItem(node, i)} className={cx(style.contentWrapper, style.small)} key={i}>
          <div className={cx(style.content, style.readOnly)}>
            <RoutingItem condition={item} position={i} />
            <StandardPortWidget name={`out${i}`} node={node} className={cx(style.outRouting, 'if-else')} />
          </div>
        </NodeContentItem>
      ))}
    </div>
  )
}

export default RouterContents
