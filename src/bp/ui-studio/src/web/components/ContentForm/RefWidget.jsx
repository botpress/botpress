import React, { Component } from 'react'

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

export default class RefWidget extends Component {
  handleChange = item => this.props.onChange(decorateRef(item.id))

  render() {
    const { $category: contentType, $subtype: subtype, type } = this.props.schema
    if (type !== 'string' || subtype !== 'ref') {
      return null
    }

    return (
      <ContentPickerWidget
        inputId={this.props.id}
        itemId={undecorateRef(this.props.value)}
        contentType={contentType}
        onChange={this.handleChange}
        placeholder={this.props.placeholder || `Pick ${contentType}`}
      />
    )
  }
}
