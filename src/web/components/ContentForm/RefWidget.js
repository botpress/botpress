import React, { Component } from 'react'
import { connect } from 'react-redux'

import { fetchContentItem } from '~/actions'

import ContentPickerWidget from '~/components/Content/Select/Widget'

const decorateRef = id => `##ref(${id})`

const undecorateRef = decoratedId => {
  if (decoratedId == null) {
    return decoratedId
  }
  const m = decoratedId && decoratedId.match(/^##ref\((.*)\)$/)
  if (!m) {
    throw new Error(`Expected decorated ref "##ref(ID)", got ${decoratedId}`)
  }
  return m[1]
}

class RefWidget extends Component {
  handleChange = item => {
    this.props.onChange(decorateRef(item.id))
  }

  componentDidMount() {
    if (this.props.value) {
      this.props.fetchContentItem(undecorateRef(this.props.value))
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value && newProps.value !== this.props.value) {
      this.props.fetchContentItem(undecorateRef(newProps.value))
    }
  }

  render() {
    const { $category: categoryId, $subtype: subtype, type } = this.props.schema
    if (type !== 'string' || subtype !== 'ref') {
      return null
    }

    const itemId = undecorateRef(this.props.value)
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
