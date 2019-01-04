import React from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'

import { Modal, Button } from 'react-bootstrap'

import ReactMarkdown from 'react-markdown'
import classnames from 'classnames'

import { updateDocumentationModal } from '~/actions'

const docs = {
  flows: require('DOCS/build/dialogs.md'),
  action: require('DOCS/build/code.md'),
  memory: require('DOCS/build/memory.md'),
  content: require('DOCS/build/content.md'),
  nlu: require('DOCS/build/nlu.md'),
  debug: require('DOCS/build/debug.md')
}

import style from './DocumentationModal.styl'

class DocumentationModal extends React.Component {
  handleClose = () => {
    this.props.updateDocumentationModal(null)
  }

  renderPage = src => {
    const transformImg = url =>
      window.origin + '/assets/ui-studio/public/external/docs/' + url.replace(/^assets\//i, '')

    return (
      <ReactMarkdown
        source={src}
        linkTarget="_blank"
        disallowedTypes={['link', 'linkReference']}
        transformImageUri={transformImg}
      />
    )
  }

  render() {
    const { currentDoc } = this.props

    if (!this.props.currentDoc) {
      return null
    }

    let source = docs[this.props.currentDoc] || '## Doc not found'

    const titleMatch = source.match(/title: \"?(.+)\"?/i)
    const title = (titleMatch && titleMatch[1]) || this.props.currentDoc

    if (source.startsWith('---')) {
      source = _.drop(source.split('---'), 2).join('---')
    }

    return (
      <Modal
        bsClass={classnames(style.modal, 'modal')}
        show={true}
        onHide={this.handleClose}
        animation={false}
        bsSize="large"
      >
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>{this.renderPage(source)}</Modal.Body>

        <Modal.Footer>
          <Button onClick={this.handleClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

const mapStateToProps = state => ({ currentDoc: state.ui.docModal })

export default connect(
  mapStateToProps,
  { updateDocumentationModal }
)(DocumentationModal)
