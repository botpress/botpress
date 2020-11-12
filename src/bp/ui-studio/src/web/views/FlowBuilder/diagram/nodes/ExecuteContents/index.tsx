import React, { FC } from 'react'

import ActionModalSmall from '../../../nodeProps/ActionModalSmall'
import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  updateFlowNode: (args: any) => void
  switchFlowNode: (id: string) => void
}

const ExecuteContents: FC<Props> = ({ node, switchFlowNode, updateFlowNode }) => {
  const handleItemChanged = actionText => {
    switchFlowNode(node.id)
    updateFlowNode({ onEnter: [actionText] })
  }

  const actionName = (node.onEnter && node.onEnter.length && node.onEnter[0]) || ''
  return (
    <div className={style.contentsWrapper}>
      <div className={style.contentWrapper}>
        <div className={style.content}>
          <ActionModalSmall text={actionName} onChange={handleItemChanged} layoutv2 />
        </div>
      </div>
    </div>
  )
}

export default ExecuteContents
