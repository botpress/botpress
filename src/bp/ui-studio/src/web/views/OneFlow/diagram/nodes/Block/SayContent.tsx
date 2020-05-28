import { MarkdownContent } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import withLanguage from '~/components/Util/withLanguage'
import { getFormData } from '~/util/NodeFormData'
import commonStyle from '~/views/FlowBuilder/common/style.scss'

import style from '../style.scss'

import { BlockNodeModel } from './index'

interface Props {
  node: BlockNodeModel
  contentType: string
  data: any
  onClick: () => void
  contentLang: string
  defaultLanguage: string
}

const SayNodeContent: FC<Props> = props => {
  const { node, contentLang, defaultLanguage, onClick } = props
  const { text, variations, contentType, markdown, items, ...nodeContent } = getFormData(
    node.contents || [{}],
    contentLang,
    defaultLanguage
  )
  const variationsCount = variations?.filter(Boolean)?.length

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
    switch (contentType) {
      case 'builtin_image':
      case 'builtin_card':
        return renderCard(nodeContent)
      case 'builtin_carousel':
        return items?.map((item, index) => renderCard(item, index)) || null
      default:
        return (
          <div className={style.text}>
            <MarkdownContent markdown={markdown} content={text} />
            {!!variationsCount && <span className={commonStyle.extraItems}>+ {variationsCount} variations</span>}
          </div>
        )
    }
  }

  return <button onClick={onClick}>{renderContent()}</button>
}

export default withLanguage(SayNodeContent)
