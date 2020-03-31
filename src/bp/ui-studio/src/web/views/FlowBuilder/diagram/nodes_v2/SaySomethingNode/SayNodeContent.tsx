import { style } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect } from 'react'
import { connect } from 'react-redux'
import { fetchContentCategories } from '~/actions'
import withLanguage from '~/components/Util/withLanguage'
import { getFormData } from '~/util/NodeFormData'

import commonStyle from '../../../common/style.scss'
import nodeStyle from '../style.scss'

import { SaySomethingNodeModel } from './index'

interface OwnProps {
  node: SaySomethingNodeModel
  contentType: string
  data: any
  contentLang: string
  defaultLanguage: string
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

const SayNodeContent: FC<Props> = props => {
  const { node, contentLang, defaultLanguage } = props
  const { text, variations, contentType, items, ...nodeContent } = getFormData(node || {}, contentLang, defaultLanguage)
  const variationsCount = variations?.filter(Boolean)?.length
  const currentCategory = props.categories?.find(category => category.id === contentType)

  console.log(Object.keys(currentCategory?.schema?.json?.properties || {}))

  useEffect(() => {
    if (!props.categories?.length) {
      props.fetchContentCategories()
    }
  }, [contentType])

  const renderCard = (item, index?) => {
    const { image, title, subtitle } = item

    return (
      <div key={index} className={nodeStyle.contentImgWrapper}>
        {image && <div style={{ backgroundImage: `url('${image}')` }} className={nodeStyle.img}></div>}
        <div className={nodeStyle.textWrapper}>
          {title && <span className={nodeStyle.primaryText}>{title}</span>}
          {subtitle && <span className={nodeStyle.secondaryText}>{_.truncate(subtitle, { length: 25 })}</span>}
        </div>
      </div>
    )
  }

  if (contentType === 'builtin_image' || contentType === 'builtin_card') {
    return renderCard(nodeContent)
  }

  if (contentType === 'builtin_carousel') {
    return items.map((item, index) => renderCard(item, index))
  }

  return (
    <div className={commonStyle['action-item']}>
      {text}
      {!!variationsCount && <span className={commonStyle.extraItems}>+ {variationsCount} variations</span>}
    </div>
  )
}

const mapStateToProps = state => ({
  categories: state.content.categories
})

const mapDispatchToProps = {
  fetchContentCategories
}

export default connect(mapStateToProps, mapDispatchToProps)(withLanguage(SayNodeContent))
