import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FormGroup, InputGroup, FormControl, Glyphicon } from 'react-bootstrap'

import store from '~/store'
import { upsertContentItem, fetchContentItem } from '~/actions'

import CreateOrEditModal from '../CreateOrEditModal'
const style = require('./style.scss')

class ContentPickerWidget extends Component {
  state = {
    showItemEdit: false,
    contentToEdit: null
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.contentItem) {
      return
    }
    this.props.fetchContentItem(nextProps.itemId)
  }

  editItem = () => {
    const { contentItem } = this.props
    this.setState({ showItemEdit: true, contentToEdit: (contentItem && contentItem.formData) || null })
  }

  handleUpdate = () => {
    const { contentItem, itemId } = this.props
    const { categoryId } = contentItem
    this.props
      .upsertContentItem({ modifyId: itemId, categoryId, formData: this.state.contentToEdit })
      .then(() => this.setState({ showItemEdit: false, contentToEdit: null }))
      .then(() => this.props.fetchContentItem(this.props.itemId, { force: true }))
      .then(this.props.onUpdate || (() => {}))
  }

  onChange = item => {
    this.props.fetchContentItem(item && item.id)
    this.props.onChange(item)
  }

  render() {
    const { inputId, contentItem, categoryId, placeholder } = this.props

    const schema = (contentItem && contentItem.categorySchema) || { json: {}, ui: {} }
    const textContent = (contentItem && `${contentItem.categoryTitle} | ${contentItem.previewText}`) || ''

    return (
      <FormGroup>
        <InputGroup>
          <FormControl placeholder={placeholder} value={textContent} disabled id={inputId || ''} />
          <InputGroup.Addon>
            {contentItem && (
              <a onClick={this.editItem} style={{ marginRight: '8px' }}>
                <Glyphicon glyph="pencil" />
              </a>
            )}
            <a onClick={() => window.botpress.pickContent({ categoryId }, this.onChange)}>
              <Glyphicon glyph="folder-open" />
            </a>
          </InputGroup.Addon>
          <CreateOrEditModal
            show={this.state.showItemEdit}
            schema={schema.json}
            uiSchema={schema.ui}
            handleClose={() => this.setState({ showItemEdit: false, contentToEdit: null })}
            formData={this.state.contentToEdit}
            handleEdit={contentToEdit => this.setState({ contentToEdit })}
            handleCreateOrUpdate={this.handleUpdate}
          />
        </InputGroup>
      </FormGroup>
    )
  }
}

const mapDispatchToProps = { upsertContentItem, fetchContentItem }
const mapStateToProps = ({ content: { itemsById } }, { itemId }) => ({ contentItem: itemsById[itemId] })
const ConnectedContentPicker = connect(mapStateToProps, mapDispatchToProps)(ContentPickerWidget)

// Passing store explicitly since this component may be imported from another botpress-module
export default props => <ConnectedContentPicker {...props} store={store} />
