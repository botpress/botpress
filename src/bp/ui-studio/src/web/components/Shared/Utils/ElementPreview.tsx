import React from 'react'
import { connect } from 'react-redux'
import { fetchContentItem } from '~/actions'
import store from '~/store'

import withLanguage from '../../Util/withLanguage'

const ElementPreview = props => {
  const { itemId, contentItem, contentLang } = props
  if (!itemId) {
    return null
  }

  if (!contentItem) {
    props.fetchContentItem(props.itemId.replace('#!', ''))
  }

  return contentItem ? `${contentItem.schema.title} | ${contentItem.previews[contentLang]}` : ''
}

const mapStateToProps = ({ content: { itemsById } }, { itemId }) => ({ contentItem: itemsById[itemId] })
const ConnectedElementPreview = connect(
  mapStateToProps,
  { fetchContentItem }
)(withLanguage(ElementPreview))

export default props => <ConnectedElementPreview {...props} store={store} />
