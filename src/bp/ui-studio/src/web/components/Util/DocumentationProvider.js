import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Glyphicon } from 'react-bootstrap'

import { addDocumentationHint, removeDocumentationHint, updateDocumentationModal } from '~/actions'

class StatusBarDocumentationProvider extends Component {
  componentDidMount() {
    this.props.addDocumentationHint(this.props.file)
  }

  componentWillUnmount() {
    this.props.removeDocumentationHint(this.props.file)
  }

  render() {
    return null
  }
}

const _LinkDocumentationProvider = props => (
  <a
    {..._.omit(props, 'children', 'onClick', 'href')}
    href="#"
    onClick={e => {
      props.updateDocumentationModal(props.file)
      e.preventDefault()
    }}
  >
    {props.children ? (
      props.children
    ) : (
      <Glyphicon glyph="question-sign" style={{ marginLeft: '3px', marginRight: '3px' }} />
    )}
  </a>
)

export default connect(
  null,
  { addDocumentationHint, removeDocumentationHint }
)(StatusBarDocumentationProvider)

export const LinkDocumentationProvider = connect(
  null,
  { updateDocumentationModal }
)(_LinkDocumentationProvider)
