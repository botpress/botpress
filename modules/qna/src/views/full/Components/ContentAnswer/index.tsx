import { FormData } from 'botpress/common/typings'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'

import style from './style.scss'

interface Props {
  content: FormData
  active: boolean
  onEdit: () => void
}

const ContentAnswer: FC<Props> = ({ content, onEdit, active }) => {
  const renderCardOrImg = ({ image, title }: FormData): JSX.Element => {
    return (
      <Fragment>
        {image && <div style={{ backgroundImage: `url('${image}')` }} className={style.img}></div>}
        {title}
      </Fragment>
    )
  }

  const ellipsisText = (text: string): string => {
    if (text.length > 51) {
      const shortText = text.substr(0, 51)
      text = `${shortText}${shortText.substr(-1) !== '.' ? '...' : ''}`
    }

    return text
  }

  const renderContent = (): JSX.Element | string => {
    switch (content.contentType) {
      case 'builtin_image':
      case 'builtin_card':
        return renderCardOrImg(content)
      case 'builtin_carousel':
        return renderCardOrImg(content.cards?.[0])
      case 'builtin_single-choice':
        return ellipsisText((content.suggestions as FormData[]).map(suggestion => suggestion.label).join(' · '))

      default:
        return null
    }
  }

  return (
    <button
      className={cx(style.contentWrapper, {
        [style.active]: active,
        [style.carousel]: content.contentType === 'builtin_carousel'
      })}
      onClick={onEdit}
    >
      <span className={style.content}>{renderContent()}</span>
    </button>
  )
}

export default ContentAnswer
