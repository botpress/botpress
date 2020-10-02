import { Contents, lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'
import Dotdotdot from 'react-dotdotdot'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  editNodeItem: (node: BlockModel, index: number) => void
  selectedNodeItem: () => { node: BlockModel; index: number }
  currentLang: string
  defaultLang: string
}

const SaySomethingContents: FC<Props> = ({ node, editNodeItem, selectedNodeItem, currentLang, defaultLang }) => {
  const selectedContent = selectedNodeItem()
  const { next } = node || {}

  const checkMissingSuggestionTranslations = suggestion => {
    const suggestions = suggestion.label || {}
    const refValue = suggestions[defaultLang] || {}
    const currentValue = suggestions[currentLang] || {}

    return [...(refValue || [])].filter(Boolean).length !== [...(currentValue || [])].filter(Boolean).length
  }

  return (
    <div className={style.contentsWrapper}>
      {next?.map((item, i) => {
        const outputPortName = `out${i}`
        return item.condition !== 'true' && checkMissingSuggestionTranslations(item.suggestion) ? (
          <button onClick={() => editNodeItem?.(node, 0)} className={style.needsTranslation}>
            {lang.tr('needsTranslation')}
          </button>
        ) : (
          <button
            key={`${i}.${item}`}
            onClick={() => editNodeItem?.(node, 0)}
            className={cx(style.contentWrapper, {
              [style.hidden]: item.condition === 'true',
              [style.active]: selectedContent?.node?.id === node.id
            })}
          >
            <div className={style.content}>
              <Dotdotdot clamp={2}>{item.suggestion?.label?.[currentLang]?.join(' · ')}</Dotdotdot>
              {!item.suggestion?.openUrl && (
                <StandardPortWidget
                  name={outputPortName}
                  node={node}
                  className={cx(style.outRouting, style.say_something)}
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default SaySomethingContents
