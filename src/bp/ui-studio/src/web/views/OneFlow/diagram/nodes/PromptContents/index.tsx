import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  defaultLang: string
  selectedNodeItem: () => { node: BlockModel; index: number }
  currentLang: string
}

const PromptContents: FC<Props> = ({ node, selectedNodeItem, currentLang }) => {
  const selectedContent = selectedNodeItem()
  const { next } = node || {}
  const { params } = node.prompt || {}

  const fieldHasMissingTranslation = (value = {}) => {
    if (value[currentLang]) {
      return false
    }

    return Object.keys(value)
      .filter(key => key !== currentLang)
      .some(key => (value[key] || []).length)
  }

  const checkMissingTranslations = () => {
    const { question, confirm } = node.prompt.params

    return fieldHasMissingTranslation(question) || fieldHasMissingTranslation(confirm)
  }

  const hasMissingTranslations = checkMissingTranslations()

  return (
    <div className={style.contentsWrapper}>
      <div
        className={cx(style.contentWrapper, {
          [style.active]: selectedContent?.node?.id === node.id
        })}
      >
        {hasMissingTranslations ? (
          <span className={style.needsTranslation}>{lang.tr('needsTranslation')}</span>
        ) : (
          <span className={style.content}>{params?.output && `$${params?.output}`}</span>
        )}
      </div>
      {next?.map((item, i) => {
        const outputPortName = `out${i}`
        return (
          <div key={`${i}.${item}`} className={style.contentWrapper}>
            <div className={cx(style.content, style.readOnly)}>
              {lang.tr(item.caption)}
              <StandardPortWidget name={outputPortName} node={node} className={style.outRouting} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PromptContents
