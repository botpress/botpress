import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FormGroup, InputGroup, FormControl } from 'react-bootstrap'
import { IoIosFolderOpen, IoMdCreate } from 'react-icons/io'

import store from '~/store'
import { upsertContentItem, fetchContentItem } from '~/actions'
import withLanguage from '../../Util/withLanguage'
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
    const { contentType } = contentItem
    this.props
      .upsertContentItem({ modifyId: itemId, contentType, formData: this.state.contentToEdit })
      .then(() => this.setState({ showItemEdit: false, contentToEdit: null }))
      .then(() => this.props.fetchContentItem(this.props.itemId, { force: true }))
      .then(this.props.onUpdate || (() => {}))
  }

  onChange = item => {
    this.props.fetchContentItem(item && item.id)
    this.props.onChange(item)
  }

  render() {
    const { inputId, contentItem, placeholder } = this.props
    const contentType = (contentItem && contentItem.contentType) || this.props.contentType
    const schema = (contentItem && contentItem.schema) || { json: {}, ui: {} }
    const textContent = (contentItem && `${schema.title} | ${contentItem.previews[this.props.contentLang]}`) || ''

    return (
      <FormGroup>
        <InputGroup>
          <FormControl placeholder={placeholder} value={textContent} disabled id={inputId || ''} />
          <InputGroup.Addon style={{ padding: 0 }}>
            {contentItem && (
              <div className={style.actionBtn} style={{ marginRight: '3px' }} onClick={this.editItem}>
                <IoMdCreate size={20} color={'#0078cf'} />
              </div>
            )}
            <div
              className={style.actionBtn}
              onClick={() => window.botpress.pickContent({ contentType }, this.onChange)}
            >
              <IoIosFolderOpen size={20} color={'#0078cf'} />
            </div>
          </InputGroup.Addon>
          <CreateOrEditModal
            show={this.state.showItemEdit}
            schema={schema.json}
            uiSchema={schema.ui}
            isEditing={this.state.contentToEdit !== null}
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
const ConnectedContentPicker = connect(
  mapStateToProps,
  mapDispatchToProps
)(withLanguage(ContentPickerWidget))

// Passing store explicitly since this component may be imported from another botpress-module
export default props => <ConnectedContentPicker {...props} store={store} />
