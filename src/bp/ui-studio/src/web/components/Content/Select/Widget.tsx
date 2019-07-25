import _ from 'lodash'
import React, { Component } from 'react'
import { FormControl, FormGroup, InputGroup } from 'react-bootstrap'
import { IoIosFolderOpen, IoMdCreate } from 'react-icons/io'
import { connect } from 'react-redux'
import { fetchContentItem, upsertContentItem } from '~/actions'
import store from '~/store'
import ActionItem from '~/views/FlowBuilder/common/action'

import withLanguage from '../../Util/withLanguage'
import CreateOrEditModal from '../CreateOrEditModal'

import style from './style.scss'

interface Props {
  fetchContentItem: any
  upsertContentItem: any
  onChange: any
  contentItem: any
  onUpdate: any
  refresh: any
  placeholder: string
  itemId: string
  contentType: any
  contentLang: string
  inputId: string
  layoutv2: boolean
}

class ContentPickerWidget extends Component<Props> {
  state = {
    showItemEdit: false,
    contentToEdit: null
  }

  componentDidMount() {
    this.props.fetchContentItem(this.props.itemId)
  }

  componentDidUpdate(prevProps) {
    if (!this.props.contentItem && prevProps.itemId !== this.props.itemId) {
      this.props.fetchContentItem(this.props.itemId)
    }
  }

  editItem = () => {
    this.setState({ showItemEdit: true, contentToEdit: _.get(this.props, 'contentItem.formData') })
  }

  handleUpdate = () => {
    const { contentItem, itemId } = this.props
    const { contentType } = contentItem
    this.props
      .upsertContentItem({ modifyId: itemId, contentType, formData: this.state.contentToEdit })
      .then(() => this.setState({ showItemEdit: false, contentToEdit: null }))
      .then(() => this.props.fetchContentItem(this.props.itemId, { force: true }))
      .then(this.props.refresh || (() => {}))
      .then(this.props.onUpdate || (() => {}))
  }

  onChange = item => {
    this.props.fetchContentItem(item && item.id)
    this.props.onChange(item)
  }

  renderModal() {
    const schema = _.get(this.props, 'contentItem.schema', { json: {}, ui: {} })

    return (
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
    )
  }

  render() {
    const { inputId, contentItem, placeholder } = this.props
    const contentType = _.get(contentItem, 'contentType', this.props.contentType)
    const schema = _.get(this.props, 'contentItem.schema', { json: {}, ui: {} })
    const textContent = (contentItem && `${schema.title} | ${contentItem.previews[this.props.contentLang]}`) || ''
    const actionText = (contentItem && 'say #!' + contentItem.id) || 'say '

    if (this.props.layoutv2) {
      return (
        <div onDoubleClick={() => window.botpress.pickContent({ contentType }, this.onChange)}>
          {contentItem ? (
            <ActionItem text={actionText} layoutv2={true} />
          ) : (
            <div
              className={style.actionBtn}
              // @ts-ignore
              onClick={() => window.botpress.pickContent({ contentType }, this.onChange)}
            >
              &lt; Select Content &gt;
            </div>
          )}

          {this.renderModal()}
        </div>
      )
    }

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
          {this.renderModal()}
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
