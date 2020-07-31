import React, { FC } from 'react'
import ActionItem from '~/views/FlowBuilder/common/action'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  editNodeItem: (node: BlockModel, index: number) => void
}

const ExecuteContents: FC<Props> = ({ node, editNodeItem }) => (
  <div className={style.contentsWrapper}>
    <div className={style.contentWrapper}>
      <div className={style.content} onClick={() => editNodeItem(node, 0)}>
        <ActionItem text={node.onEnter?.[0] ?? ''} layoutv2 />
      </div>
    </div>
  </div>
)

export default ExecuteContents
