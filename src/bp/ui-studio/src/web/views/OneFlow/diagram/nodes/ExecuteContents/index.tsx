import { lang } from 'botpress/shared'
import { CUSTOM_ACTION } from 'common/action'
import React, { FC } from 'react'
import ActionItem from '~/views/FlowBuilder/common/action'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  editNodeItem: (node: BlockModel, index: number) => void
}

const ExecuteContents: FC<Props> = ({ node, editNodeItem }) => {
  let actionName = lang.tr('studio.flow.node.noActionSelected')

  const nodeActionName = node.execute?.actionName
  if (nodeActionName) {
    actionName = nodeActionName === CUSTOM_ACTION ? lang.tr('module.ndu.conditions.customCode') : nodeActionName
  }

  return (
    <div className={style.contentsWrapper}>
      <div className={style.contentWrapper}>
        <div className={style.content} onClick={() => editNodeItem(node, 0)}>
          {actionName}
        </div>
      </div>
    </div>
  )
}

export default ExecuteContents
