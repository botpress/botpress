import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'
import NodeContentItem from '../Components/NodeContentItem'

interface Props {
  node: BlockModel
  editNodeItem: (node: BlockModel, index: number) => void
  selectedNodeItem: () => { node: BlockModel; index: number }
  getConditions: () => any
}

const TriggerContents: FC<Props> = ({ node, editNodeItem, selectedNodeItem, getConditions }) => {
  const conditionLabels = getConditions().reduce((acc, cond) => ({ ...acc, [cond.id]: cond.label }), {})
  const selectedCondition = selectedNodeItem()

  return (
    <div className={style.contentsWrapper}>
      {node.conditions?.map((condition, index) => (
        <Fragment key={index}>
          <NodeContentItem
            className={cx(style.hasJoinLabel, {
              [style.active]: selectedCondition?.node?.id === node.id && index === selectedCondition?.index
            })}
            onEdit={() => editNodeItem?.(node, index)}
          >
            <span className={style.content}>{lang.tr(conditionLabels[condition.id], { ...condition.params })}</span>
          </NodeContentItem>
          <span className={style.joinLabel}>{lang.tr('and')}</span>
        </Fragment>
      ))}
    </div>
  )
}

export default TriggerContents
