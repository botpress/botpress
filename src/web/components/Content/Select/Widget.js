import React, { Component } from 'react'
import { connect } from 'react-redux'

import { upsertContentItem } from '~/actions'

import CreateOrEditModal from '../CreateOrEditModal'
const style = require('./style.scss')

class ContentPickerWidget extends Component {
  state = {
    showItemEdit: false,
    contentToEdit: null
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
      .then(this.props.onUpdate)
  }

  handleFormEdited = data => {
    this.setState({ contentToEdit: data })
  }

  render() {
    const { inputId, contentItem, categoryId, onChange, placeholder } = this.props

    const schema = (contentItem && contentItem.categorySchema) || { json: {}, ui: {} }
    const textContent = (contentItem && `${contentItem.categoryTitle} | ${contentItem.previewText}`) || ''

    return (
      <div className="input-group">
        <input
          type="text"
          placeholder={placeholder}
          value={textContent}
          disabled
          className="form-control"
          id={inputId || ''}
        />
        <span className="input-group-btn">
          <button
            className={`btn btn-default ${style.editButton}`}
            disabled={!contentItem}
            type="button"
            onClick={this.editItem}
          >
            Edit...
          </button>
        </span>

        <CreateOrEditModal
          show={this.state.showItemEdit}
          schema={schema.json}
          uiSchema={schema.ui}
          handleClose={() => this.setState({ showItemEdit: false, contentToEdit: null })}
          formData={this.state.contentToEdit}
          handleEdit={this.handleFormEdited}
          handleCreateOrUpdate={this.handleUpdate}
        />
        <span className="input-group-btn">
          <button
            className="btn btn-default"
            type="button"
            onClick={() => window.botpress.pickContent({ categoryId }, onChange)}
          >
            Pick Content...
          </button>
        </span>
      </div>
    )
  }
}

const mapDispatchToProps = { upsertContentItem }

export default connect(null, mapDispatchToProps)(ContentPickerWidget)
