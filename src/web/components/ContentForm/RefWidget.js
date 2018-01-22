import React, { Component } from 'react'
import { connect } from 'react-redux'

import { fetchContentItem } from '~/actions'

import ContentPickerWidget from '~/components/Content/Select/Widget'

class RefWidget extends Component {
  state = {}

  handleChange = item => {
    this.props.onChange(item.id)
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value) {
      this.props.fetchContentItem(newProps.value)
    }
  }

  render() {
    const { $category: categoryId, $subtype: subtype, type } = this.props.schema
    if (type !== 'string' || subtype !== 'ref') {
      return null
    }

    const itemId = this.props.value
    const contentItem = itemId && this.props.contentItems ? this.props.contentItems[itemId] : null
    if (itemId && !contentItem) {
      // item is not fetched yet, will rerender when it's done
      return null
    }

    return (
      <ContentPickerWidget
        inputId={this.props.id}
        itemId={itemId}
        contentItem={contentItem}
        categoryId={categoryId}
        onChange={this.handleChange}
        placeholder={this.props.placeholder || `Pick ${categoryId}`}
      />
    )
  }
}

const mapStateToProps = state => ({ contentItems: state.content.itemsById })
const mapDispatchToProps = { fetchContentItem }

export default connect(mapStateToProps, mapDispatchToProps)(RefWidget)
