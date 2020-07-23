import { FormData } from 'botpress/sdk'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'
import Dotdotdot from 'react-dotdotdot'

import { lang } from '../../../translations'
import MarkdownContent from '../../../MarkdownContent'

import style from './style.scss'
import { ItemProps } from './typings'

const ContentAnswer: FC<ItemProps> = ({ content, onEdit, active, contentLang }) => {
  const renderCardOrImg = ({ image, title }: FormData): JSX.Element => {
    return (
      <div className={style.contentImgWrapper}>
        {image && <div style={{ backgroundImage: `url('${image}')` }} className={style.img}></div>}
        <div className={style.textWrapper}>
          <Dotdotdot clamp={3}>{title?.[contentLang]}</Dotdotdot>
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
          <Dotdotdot clamp={3}>
            {(content.choices as FormData[])?.map(choice => choice.title?.[contentLang]).join(' · ')}
          </Dotdotdot>
        )
      default:
        const variationsCount = (content.variations?.[contentLang] || [])?.filter(Boolean)?.length
        return (
          <Fragment>
            <Dotdotdot clamp={!!variationsCount ? 2 : 3}>
              <MarkdownContent markdown={content.markdown as boolean} content={content.text?.[contentLang] || ''} />
            </Dotdotdot>
            {!!variationsCount && (
              <span className={style.extraItems}>
                + {variationsCount} {lang('module.builtin.types.text.alternative_plural')}
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
