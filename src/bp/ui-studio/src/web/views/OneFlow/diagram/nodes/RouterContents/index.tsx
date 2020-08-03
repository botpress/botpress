import cx from 'classnames'
import React, { FC } from 'react'
import RoutingItem from '~/views/FlowBuilder/common/routing'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
}

const RouterContents: FC<Props> = ({ node }) =>
  !!node.next?.length && (
    <div className={style.contentsWrapper}>
      {node.next.map((item, i) => {
        const outputPortName = `out${i}`
        return (
          <div className={style.contentWrapper} key={`${i}.${item}`}>
            <div className={cx(style.content, style.promptPortContent)}>
              <RoutingItem condition={item} position={i} />
              <StandardPortWidget name={outputPortName} node={node} className={style.outRouting} />
            </div>
          </div>
        )
      })}
    </div>
  )

export default RouterContents
