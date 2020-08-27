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
  getCurrentLang: () => string
  defaultLang: string
}

const TriggerContents: FC<Props> = ({ node, editNodeItem, selectedNodeItem, getConditions, getCurrentLang }) => {
  const conditionLabels = getConditions().reduce((acc, cond) => ({ ...acc, [cond.id]: cond.label }), {})
  const selectedCondition = selectedNodeItem()
  const currentLang = getCurrentLang()
  const hasMissingTranslations = false

  return (
    <div className={style.contentsWrapper}>
      {hasMissingTranslations && <span className={style.needsTranslation}>{lang.tr('needsTranslation')}</span>}
      {node.conditions?.map((condition, index) => (
        <Fragment key={index}>
          <NodeContentItem
            className={cx(style.hasJoinLabel, {
              [style.active]: selectedCondition?.node?.id === node.id && index === selectedCondition?.index
            })}
            onEdit={() => editNodeItem?.(node, index)}
          >
            <span className={style.content}>
              {lang.tr(conditionLabels[condition.id], {
                ...condition.params,
                firstSentence: condition.params?.utterances?.[currentLang]?.[0]
              })}
            </span>
          </NodeContentItem>
          <span className={style.joinLabel}>{lang.tr('and')}</span>
        </Fragment>
      ))}
    </div>
  )
}

export default TriggerContents
