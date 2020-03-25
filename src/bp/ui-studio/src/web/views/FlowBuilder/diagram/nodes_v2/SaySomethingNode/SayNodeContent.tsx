import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import { connect } from 'react-redux'
import withLanguage from '~/components/Util/withLanguage'
import { getFormData } from '~/util/NodeFormData'

import { getCurrentFlowNode } from '../../../../../reducers'
import commonStyle from '../../../common/style.scss'
import nodeStyle from '../style.scss'

import { SaySomethingNodeModel } from './index'

interface Props {
  currentFlowNode: any
  formData: any
  node: SaySomethingNodeModel
  contentLang: string
  defaultLanguage: string
}

const SayNodeContent: FC<Props> = props => {
  const { node, contentLang, defaultLanguage } = props

  const renderContent = () => {
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
      <Fragment>
        {_.truncate(text, { length: 100 })}
        {!!variationsCount && <span className={commonStyle.extraItems}>+ {variationsCount} variations</span>}
      </Fragment>
    )
  }

  return <div className={commonStyle['action-item']}>{renderContent()}</div>
}

const mapStateToProps = state => ({
  currentFlowNode: getCurrentFlowNode(state)
})

export default connect(mapStateToProps)(withLanguage(SayNodeContent))
