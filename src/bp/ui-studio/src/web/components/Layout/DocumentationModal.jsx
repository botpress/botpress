import React from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'
import { Modal, Button } from 'react-bootstrap'
import ReactMarkdown from 'react-markdown'
import classnames from 'classnames'

import { updateDocumentationModal } from '~/actions'

import style from './DocumentationModal.styl'

const docs = {
  flows: require('DOCS/main/dialog.md'),
  action: require('DOCS/main/code.md'),
  memory: require('DOCS/main/memory.md'),
  content: require('DOCS/main/content.md'),
  nlu: require('DOCS/main/nlu.md'),
  debug: require('DOCS/main/emulator.md')
}

class DocumentationModal extends React.Component {
  handleClose = () => this.props.updateDocumentationModal(null)

  renderPage = src => {
    const transformImg = url =>
      window.origin + '/assets/ui-studio/public/external/docs/' + url.replace(/^assets\//i, '')

    return (
      <ReactMarkdown
        source={this.removeFileHeader(src)}
        linkTarget="_blank"
        disallowedTypes={['link', 'linkReference']}
        transformImageUri={transformImg}
      />
    )
  }

  renderNotFound = doc => `
## Documentation "${doc}" Not Found
This is probably a bug, please report it on https://github.com/botpress/botpress/issues
`

  removeFileHeader = source => (source.startsWith('---') ? _.drop(source.split('---'), 2).join('---') : source)

  render() {
    const { currentDoc } = this.props

    if (!currentDoc) {
      return null
    }

    let source = docs[currentDoc] || this.renderNotFound(currentDoc)

    const titleMatch = source.match(/title: \"?(.+)\"?/i)
    const title = (titleMatch && titleMatch[1]) || currentDoc

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
