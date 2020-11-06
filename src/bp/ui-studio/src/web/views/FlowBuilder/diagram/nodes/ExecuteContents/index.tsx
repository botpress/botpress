import { lang } from 'botpress/shared'
import { CUSTOM_ACTION } from 'common/action'
import React, { FC } from 'react'

import { BlockProps } from '../Block'
import style from '../Components/style.scss'
import NodeContentItem from '../Components/NodeContentItem'

type Props = Pick<BlockProps, 'node' | 'editNodeItem'>

const ExecuteContents: FC<Props> = ({ node, editNodeItem }) => {
  let actionName = lang.tr('studio.flow.node.noActionSelected')

  const nodeActionName = node.execute?.actionName

  if (nodeActionName) {
    const customCodeTitle = node.execute?.title || lang.tr('studio.flow.node.customCode')
    actionName = nodeActionName === CUSTOM_ACTION ? customCodeTitle : nodeActionName
  }

  return (
    <div className={style.contentsWrapper}>
      <NodeContentItem onEdit={() => editNodeItem(node, 0)} className={style.contentWrapper}>
        <div className={style.content}>{actionName}</div>
      </NodeContentItem>
    </div>
  )
}

export default ExecuteContents
