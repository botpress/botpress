import { MarkdownContent } from 'botpress/shared'
import cx from 'classnames'
import { FormData } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import Dotdotdot from 'react-dotdotdot'
import withLanguage from '~/components/Util/withLanguage'

import style from '../style.scss'

import contentStyle from './style.scss'

interface Props {
  content: FormData
  contentType: string
  data: any
  onClick: () => void
  contentLang: string
  defaultLanguage: string
  isSelected: boolean
}

const SayNodeContent: FC<Props> = props => {
  const { content, onClick, isSelected } = props

  const variationsCount = (content.variations as FormData[])?.filter(v => v.item)?.length

  const renderCard = (item, index?) => {
    const { image, title, text } = item

    return (
      <div key={index} className={style.contentImgWrapper}>
        {image && <div style={{ backgroundImage: `url('${image}')` }} className={style.img}></div>}
        <div className={style.textWrapper}>
          <Dotdotdot clamp={text ? 2 : 3}>{title && title}</Dotdotdot>
          {text && (
            <Dotdotdot clamp={1}>
              <span className={style.secondaryText}>{_.truncate(text, { length: 25 })}</span>
            </Dotdotdot>
          )}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (content.contentType) {
      case 'builtin_image':
      case 'builtin_card':
        return renderCard(content)
      case 'builtin_carousel':
        return renderCard(content.cards?.[0])
      default:
        return (
          <Fragment>
            <Dotdotdot clamp={!!variationsCount ? 2 : 3}>
              <MarkdownContent markdown={content.markdown as boolean} content={content.text as string} />
            </Dotdotdot>
            {!!variationsCount && <span className={contentStyle.extraItems}>+ {variationsCount} variations</span>}
          </Fragment>
        )
    }
  }

  return (
    <button className={cx(contentStyle.content, { [contentStyle.selected]: isSelected })} onClick={onClick}>
      {renderContent()}
    </button>
  )
}

export default withLanguage(SayNodeContent)
