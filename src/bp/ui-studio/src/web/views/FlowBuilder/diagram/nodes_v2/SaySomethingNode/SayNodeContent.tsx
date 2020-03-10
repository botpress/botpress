import React, { FC } from 'react'

import withLanguage from '../../../../../components/Util/withLanguage'
import { getFormData } from '../../../../../util/NodeFormData'
import commonStyle from '../../../common/style.scss'

import { SaySomethingNodeModel } from './index'

interface Props {
  forceRefresh: boolean
  node: SaySomethingNodeModel
  contentLang: string
  defaultLanguage: string
}

const SayNodeContent: FC<Props> = props => {
  const { node, contentLang, defaultLanguage } = props
  const { text, variations } = getFormData(node || {}, contentLang, defaultLanguage)
  const variationsCount = variations?.filter(Boolean)?.length

  return (
    <div className={commonStyle['action-item']}>
      {text}
      {!!variationsCount && <span className={commonStyle.extraItems}>+ {variationsCount} variations</span>}
    </div>
  )
}

export default withLanguage(SayNodeContent)
