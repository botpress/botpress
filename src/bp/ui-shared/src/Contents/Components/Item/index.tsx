import { FormData } from 'botpress/sdk'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'
import Dotdotdot from 'react-dotdotdot'

import { convertToHtml } from '../../../FormFields/SuperInput/utils'
import MarkdownContent from '../../../MarkdownContent'

import style from './style.scss'
import { ItemProps } from './typings'

const ContentItem: FC<ItemProps> = ({ content, onEdit, active, contentLang }) => {
  if (content.contentType === 'builtin_single-choice') {
    return null
  }

  const renderCardOrImg = ({ image, title }: FormData): JSX.Element => {
    return (
      <div className={style.contentImgWrapper}>
        {image && <div style={{ backgroundImage: `url('${image}')` }} className={style.img}></div>}
        <div className={style.textWrapper}>
          <Dotdotdot clamp={2}>
            <span dangerouslySetInnerHTML={{ __html: convertToHtml(title?.[contentLang]) }} />
          </Dotdotdot>
        </div>
      </div>
    )
  }

  const renderContent = (): JSX.Element | string => {
    switch (content.contentType) {
      case 'builtin_image':
      case 'builtin_card':
        return renderCardOrImg(content)
      case 'builtin_carousel':
        return renderCardOrImg(content.items?.[0] || {})
      case 'builtin_single-choice':
        return (
          <Dotdotdot clamp={2}>
            {(content.choices as FormData[])?.map((choice, index) => {
              return (
                <Fragment key={index}>
                  <span dangerouslySetInnerHTML={{ __html: convertToHtml(choice.title?.[contentLang] || '') }} />
                  {index !== content.choices.length - 1 && ' · '}
                </Fragment>
              )
            })}
          </Dotdotdot>
        )
      default:
        return (
          <Fragment>
            <Dotdotdot clamp={2}>
              <MarkdownContent markdown={content.markdown as boolean} content={content.text?.[contentLang] || ''} />
            </Dotdotdot>
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

export default ContentItem
