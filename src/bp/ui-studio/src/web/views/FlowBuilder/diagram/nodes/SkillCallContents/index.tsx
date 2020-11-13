import { IconName } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'
import ConditionItem from '~/views/FlowBuilder/common/condition'

import ActionItem from '../../../common/action'
import { StandardPortWidget } from '../../nodes/Ports'
import { BlockProps } from '../Block'
import style from '../Components/style.scss'
import localStyle from '../StandardContents/style.scss'

export interface SkillDefinition {
  id: string
  name: string
  icon: IconName
  moduleName: string
}

type Props = Pick<BlockProps, 'node'>

const SkillCallContents: FC<Props> = ({ node }) => {
  return (
    <div className={cx(style.contentsWrapper, style['skill-call'])}>
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

export default SkillCallContents
