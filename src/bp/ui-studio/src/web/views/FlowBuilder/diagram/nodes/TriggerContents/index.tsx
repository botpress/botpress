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
  currentLang: string
  defaultLang: string
}

const TriggerContents: FC<Props> = ({
  node,
  editNodeItem,
  selectedNodeItem,
  getConditions,
  currentLang,
  defaultLang
}) => {
  const conditionLabels = getConditions().reduce((acc, cond) => ({ ...acc, [cond.id]: cond.label }), {})
  const selectedCondition = selectedNodeItem()

  return (
    <div className={style.contentsWrapper}>
      {!node.conditions?.length && (
        <div className={style.contentWrapper}>
          <div className={style.content}>Add conditions to get started</div>
        </div>
      )}
      {node.conditions?.map((condition, index) => {
        const { topicName, channelName, language } = condition.params || {}

        return (
          <Fragment key={index}>
            <NodeContentItem
              className={cx(style.hasJoinLabel, {
                [style.active]: selectedCondition?.node?.id === node.id && index === selectedCondition?.index
              })}
              onEdit={() => !node.isReadOnly && editNodeItem?.(node, index)}
            >
              <span className={cx(style.content, { [style.readOnly]: node.isReadOnly })}>
                {lang.tr(conditionLabels[condition.id], {
                  topicName: topicName || '',
                  channelName: channelName === 'api' ? lang.tr('converseApi') : channelName,
                  language: language ? lang.tr(`isoLangs.${language}.name`).toLowerCase() : '',
                  firstSentence: condition.params?.utterances?.[currentLang]?.[0]
                })}
              </span>
            </NodeContentItem>

            <span className={style.joinLabel}>{lang.tr('and')}</span>
          </Fragment>
        )
      })}
    </div>
  )
}

export default TriggerContents
