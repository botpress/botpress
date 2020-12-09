import cx from 'classnames'
import React, { FC } from 'react'
import ConditionItem from '~/views/FlowBuilder/common/condition'

import ActionItem from '../../../common/action'
import { StandardPortWidget } from '../../nodes/Ports'
import { BlockProps } from '../Block'
import style from '../Components/style.scss'

import localStyle from './style.scss'

type Props = Pick<BlockProps, 'node'>

const StandardContents: FC<Props> = ({ node }) => {
  const isWaiting = node.waitOnReceive

  return (
    <div className={cx(style.contentsWrapper, style.standard)}>
      {node.onEnter?.map((item, i) => {
        return (
          <ActionItem
            key={`${i}.${item}`}
            className={cx(style.contentWrapper, style.content, localStyle.item)}
            text={item}
          />
        )
      })}

      {isWaiting && <div className={localStyle.waitInput}>wait for user input</div>}

      {node.onReceive?.map((item, i) => {
        return (
          <ActionItem
            key={`${i}.${item}`}
            className={cx(style.contentWrapper, style.content, localStyle.item)}
            text={item}
          />
        )
      })}

      {node.next?.map((item, i) => {
        const outputPortName = `out${i}`
        return (
          <div key={`${i}.${item}`} className={cx(style.contentWrapper, style.small)}>
            <div className={cx(style.content, style.readOnly)}>
              <ConditionItem condition={item} position={i} />
              <StandardPortWidget name={outputPortName} node={node} className={style.outRouting} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StandardContents
