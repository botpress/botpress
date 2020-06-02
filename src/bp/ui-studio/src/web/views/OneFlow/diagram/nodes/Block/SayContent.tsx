import { MarkdownContent } from 'botpress/shared'
import { FormData } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'
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
}

const SayNodeContent: FC<Props> = props => {
  const { content, onClick } = props

  const variationsCount = (content.variations as FormData[])?.filter(v => v.item)?.length

  const renderCard = (item, index?) => {
    const { image, title, subtitle } = item

    return (
      <div key={index} className={style.contentImgWrapper}>
        {image && <div style={{ backgroundImage: `url('${image}')` }} className={style.img}></div>}
        <div className={style.textWrapper}>
          {title && <span className={style.primaryText}>{title}</span>}
          {subtitle && <span className={style.secondaryText}>{_.truncate(subtitle, { length: 25 })}</span>}
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
        return (content.cards as FormData[])?.map((item, index) => renderCard(item, index)) || null
      default:
        return (
          <Fragment>
            <MarkdownContent markdown={content.markdown as boolean} content={content.text as string} />
            {!!variationsCount && <span className={contentStyle.extraItems}>+ {variationsCount} variations</span>}
          </Fragment>
        )
    }
  }

  return (
    <button className={contentStyle.content} onClick={onClick}>
      {renderContent()}
    </button>
  )
}

export default withLanguage(SayNodeContent)
