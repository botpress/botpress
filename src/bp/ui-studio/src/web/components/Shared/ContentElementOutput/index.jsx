import React, { Component } from 'react'

import { connect } from 'react-redux'
import store from '~/store'
import { fetchContentItem } from '~/actions'
import withLanguage from '../../Util/withLanguage'

const ContentElementOutput = (props) => {
  props.fetchContentItem(props.itemId)
  const { contentItem, contentLang } = props
  const textContent = (contentItem && `${contentItem.schema.title} | ${contentItem.previews[contentLang]}`) || ''
  return textContent
}

const mapDispatchToProps = { fetchContentItem }
const mapStateToProps = ({ content: { itemsById } }, { itemId }) => ({ contentItem: itemsById[itemId] })
const ConnectedContentElementOutput = connect(
  mapStateToProps,
  mapDispatchToProps
)(withLanguage(ContentElementOutput))

export default props => <ConnectedContentElementOutput {...props} store={store} />