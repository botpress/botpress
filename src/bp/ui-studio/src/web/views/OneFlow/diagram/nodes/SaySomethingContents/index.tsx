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

  const fieldHasMissingTranslation = (value = {}) => {
    if (value[currentLang]) {
      return false
    }

    return Object.keys(value)
      .filter(key => key !== currentLang)
      .some(key => (value[key] || []).length)
  }

  const checkCardMissingTranslation = card => {
    return (
      fieldHasMissingTranslation(card.title) ||
      fieldHasMissingTranslation(card.subtitle) ||
      card.actions.some(action => fieldHasMissingTranslation(action.title) || fieldHasMissingTranslation(action.text))
    )
  }

  const checkMissingTranslations = content => {
    let curLangLength
    switch (content.contentType) {
      case 'builtin_image':
        return fieldHasMissingTranslation(content.title)
      case 'builtin_card':
        return checkCardMissingTranslation(content)
      case 'builtin_carousel':
        return content.items.some(item => checkCardMissingTranslation(item))
      default:
        const variations = content.variations || {}
        curLangLength = variations[currentLang]?.length || 0
        const text = content.text || {}

        return !!(
          !text[currentLang] &&
          !curLangLength &&
          (variations[defaultLang]?.filter(Boolean).length || text[defaultLang])
        )
    }
  }

  const checkMissingSuggestionTranslations = (content, index) => {
    const suggestions = content?.suggestions || {}
    const refValue = suggestions[defaultLang]?.[index] || {}
    const currentValue = suggestions[currentLang]?.[index] || {}

    return (
      [refValue?.name || '', ...(refValue?.tags || [])].filter(Boolean).length !==
      [currentValue?.name || '', ...(currentValue?.tags || [])].filter(Boolean).length
    )
  }

  return (
    <div className={style.contentsWrapper}>
      {node.contents?.map((content, index) =>
        checkMissingTranslations(content) ? (
          <button
            onClick={() => editNodeItem?.(node, index)}
            key={`${index}${currentLang}`}
            className={style.needsTranslation}
          >
            {lang.tr('needsTranslation')}
          </button>
        ) : (
          <Contents.Item
            active={selectedContent?.node?.id === node.id && index === selectedContent?.index}
            key={`${index}${currentLang}`}
            onEdit={() => editNodeItem?.(node, index)}
            contentLang={currentLang}
            content={content}
          />
        )
      )}
      {next?.map((item, i) => {
        const outputPortName = `out${i}`
        return item.condition !== 'true' &&
          checkMissingSuggestionTranslations(node.contents[item.contentIndex], i - 1) ? (
          <button onClick={() => editNodeItem?.(node, 0)} className={style.needsTranslation}>
            {lang.tr('needsTranslation')}
          </button>
        ) : (
          <button
            key={`${i}.${item}`}
            onClick={() => editNodeItem?.(node, item.contentIndex)}
            className={cx(style.contentWrapper, {
              [style.hidden]: item.condition === 'true',
              [style.active]: selectedContent?.node?.id === node.id && item.contentIndex === selectedContent?.index
            })}
          >
            <div className={style.content}>
              <Dotdotdot clamp={2}>{item.caption}</Dotdotdot>
              <StandardPortWidget
                name={outputPortName}
                node={node}
                className={cx(style.outRouting, style.say_something)}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default SaySomethingContents
