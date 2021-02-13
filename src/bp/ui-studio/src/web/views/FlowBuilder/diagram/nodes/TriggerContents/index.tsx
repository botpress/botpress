import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'

import { BlockProps } from '../Block'
import NodeContentItem from '../Components/NodeContentItem'
import style from '../Components/style.scss'

type Props = { currentLang: string; defaultLang: string } & Pick<
  BlockProps,
  'node' | 'editNodeItem' | 'selectedNodeItem' | 'getConditions'
>

const TriggerContents: FC<Props> = ({
  node,
  editNodeItem,
  selectedNodeItem,
  getConditions,
  currentLang,
  defaultLang
}) => {
  const conditionLabels = getConditions().reduce((acc, { id, label }) => ({ ...acc, [id]: label }), {})
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
