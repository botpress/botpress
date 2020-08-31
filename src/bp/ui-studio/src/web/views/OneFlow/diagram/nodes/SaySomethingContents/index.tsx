import { Contents, lang } from 'botpress/shared'
import React, { FC } from 'react'

import { nodeSaySomething } from '../../../../FlowBuilder/diagram/nodes_v2/style.scss'
import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  editNodeItem: (node: BlockModel, index: number) => void
  selectedNodeItem: () => { node: BlockModel; index: number }
  currentLang: string
  defaultLang: string
}

const SaySomethingContents: FC<Props> = ({ node, editNodeItem, selectedNodeItem, currentLang }) => {
  const selectedContent = selectedNodeItem()

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

  const checkMissingTranslations = () => {
    return node.contents?.some(content => {
      switch (content.contentType) {
        case 'builtin_image':
          return fieldHasMissingTranslation(content.title)
        case 'builtin_card':
          return checkCardMissingTranslation(content)
        case 'builtin_carousel':
          return content.items.some(item => checkCardMissingTranslation(item))
        case 'builtin_single-choice':
          return content.choices?.some(
            choice => fieldHasMissingTranslation(choice.title) || fieldHasMissingTranslation(choice.value)
          )
        default:
          const translatedVariations = Object.keys(content.variations || {}).reduce((acc, key) => {
            return { ...acc, [key]: content.variations[key].filter(Boolean).length }
          }, {})
          const curLangLength = translatedVariations[currentLang] || 0

          return (
            fieldHasMissingTranslation(content.text) ||
            Object.keys(translatedVariations)
              .filter(l => l !== currentLang)
              .some(l => translatedVariations[l] > curLangLength)
          )
      }
    })
  }
  const hasMissingTranslations = checkMissingTranslations()

  return (
    <div className={style.contentsWrapper}>
      {hasMissingTranslations && <span className={style.needsTranslation}>{lang.tr('needsTranslation')}</span>}
      {node.contents?.map((content, index) => (
        <Contents.Item
          active={selectedContent?.node?.id === node.id && index === selectedContent?.index}
          key={`${index}${currentLang}`}
          onEdit={() => editNodeItem?.(node, index)}
          contentLang={currentLang}
          content={content}
        />
      ))}
    </div>
  )
}

export default SaySomethingContents
