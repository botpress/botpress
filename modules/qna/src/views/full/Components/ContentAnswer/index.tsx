import cx from 'classnames'
import React, { FC, Fragment } from 'react'

import style from './style.scss'

interface Props {
  // TODO change once typings are implemented
  content: any
  active: boolean
  onEdit: () => void
}

const ContentAnswer: FC<Props> = ({ content, onEdit, active }) => {
  const renderCardOrImg = ({ image, title }): JSX.Element => {
    return (
      <Fragment>
        {image && <div style={{ backgroundImage: `url('${image}')` }} className={style.img}></div>}
        {title}
      </Fragment>
    )
  }

  const ellipsisText = (text: string): string => {
    if (text.length > 51) {
      text = `${text.substr(0, 51)}${text.substr(-1) !== '.' ? '...' : ''}`
    }

    return text
  }

  const renderContent = (): JSX.Element | string => {
    switch (content.contentType) {
      case 'image':
      case 'card':
        return renderCardOrImg(content)
      case 'carousel':
        return renderCardOrImg(content.cards?.[0])
      case 'suggestions':
        return ellipsisText(content.suggestions.map(suggestion => suggestion.label).join(' · '))

      default:
        return null
    }
  }

  return (
    <button
      className={cx(style.contentWrapper, {
        [style.active]: active,
        [style.carousel]: content.contentType === 'carousel'
      })}
      onClick={onEdit}
    >
      <span className={style.content}>{renderContent()}</span>
    </button>
  )
}

export default ContentAnswer
