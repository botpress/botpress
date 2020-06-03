import cx from 'classnames'
import { FormData } from 'common/typings'
import React, { FC, Fragment } from 'react'

import { lang } from '../../../translations'
import MarkdownContent from '../../../MarkdownContent'

import style from './style.scss'
import { ItemProps } from './typings'

const ContentAnswer: FC<ItemProps> = ({ content, onEdit, active }) => {
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
        const variationsCount = (content.variations as FormData[])?.filter(v => v.item)?.length
        return (
          <Fragment>
            <MarkdownContent markdown={content.markdown as boolean} content={content.text as string} />
            {!!variationsCount && (
              <span className={style.extraItems}>
                + {variationsCount} {lang('module.builtin.types.text.alternatives')}
              </span>
            )}
          </Fragment>
        )
    }
  }

  return (
    <button
      className={cx('content-wrapper', style.contentWrapper, {
        [`${style.active} active`]: active,
        [style.carousel]: content.contentType === 'builtin_carousel'
      })}
      onClick={onEdit}
    >
      <span className={cx(style.content, 'content')}>{renderContent()}</span>
    </button>
  )
}

export default ContentAnswer
