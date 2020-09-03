import { Contents, lang } from 'botpress/shared'
import React, { FC } from 'react'

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
        const variations = content.variations || {}
        const curLangLength = variations[currentLang]?.length || 0
        const text = content.text || {}

        return !!(
          !text[currentLang] &&
          !curLangLength &&
          (variations[defaultLang]?.filter(Boolean).length || text[defaultLang])
        )
    }
  }

  return (
    <div className={style.contentsWrapper}>
      {node.contents?.map((content, index) =>
        checkMissingTranslations(content) ? (
          <button onClick={() => editNodeItem?.(node, index)} className={style.needsTranslation}>
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
    </div>
  )
}

export default SaySomethingContents
