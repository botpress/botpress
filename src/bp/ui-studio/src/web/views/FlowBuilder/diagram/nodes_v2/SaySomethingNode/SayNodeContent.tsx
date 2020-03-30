import _ from 'lodash'
import React, { FC } from 'react'
import withLanguage from '~/components/Util/withLanguage'
import { getFormData } from '~/util/NodeFormData'

import commonStyle from '../../../common/style.scss'
import nodeStyle from '../style.scss'

import { SaySomethingNodeModel } from './index'

interface Props {
  node: SaySomethingNodeModel
  contentType: string
  data: any
  contentLang: string
  defaultLanguage: string
}

const SayNodeContent: FC<Props> = props => {
  const { node, contentLang, defaultLanguage } = props
  const { text, variations, contentType, title, image } = getFormData(node || {}, contentLang, defaultLanguage)
  const variationsCount = variations?.filter(Boolean)?.length

  if (contentType === 'builtin_image') {
    return (
      <div className={nodeStyle.contentImgWrapper}>
        {image && <div style={{ backgroundImage: `url('${image}')` }} className={nodeStyle.img}></div>}
        {_.truncate(title, { length: 55 })}
      </div>
    )
  }

  return (
    <div className={commonStyle['action-item']}>
      {text}
      {!!variationsCount && <span className={commonStyle.extraItems}>+ {variationsCount} variations</span>}
    </div>
  )
}

export default withLanguage(SayNodeContent)
