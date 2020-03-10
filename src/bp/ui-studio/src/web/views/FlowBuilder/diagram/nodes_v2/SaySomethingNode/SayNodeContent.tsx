import React, { FC } from 'react'

import withLanguage from '../../../../../components/Util/withLanguage'
import { getFormData } from '../../../../../util/NodeFormData'
import commonStyle from '../../../common/style.scss'

import { SaySomethingNodeModel } from './index'

interface Props {
  node: SaySomethingNodeModel
  contentLang: string
  defaultLanguage: string
}

const SayNodeContent: FC<Props> = props => {
  const { node, contentLang, defaultLanguage } = props
  const { text } = getFormData(node || {}, contentLang, defaultLanguage)

  return <div className={commonStyle['action-item']}>{text}</div>
}

export default withLanguage(SayNodeContent)
