import { Button, Classes, ControlGroup, InputGroup } from '@blueprintjs/core'
import { ContentElement } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { deleteMedia, fetchContentItem, upsertContentItem } from '~/actions'
import store from '~/store'
import { CONTENT_TYPES_MEDIA } from '~/util/ContentDeletion'
import ActionItem from '~/views/FlowBuilder/common/action'

import withLanguage from '../../Util/withLanguage'
import CreateOrEditModal from '../CreateOrEditModal'

import style from './style.scss'

interface DispatchProps {
  deleteMedia: (formData: any) => Promise<void>
  fetchContentItem: (itemId: string, query?: any) => Promise<void>
  upsertContentItem: (item: any) => Promise<void>
}

interface StateProps {
  contentItem: ContentElement
  contentType: string
  contentLang: string
}

export interface OwnProps {
  itemId: string
  placeholder: string
  inputId?: string
  layoutv2?: boolean
  onChange: (item: ContentElement) => void
  onUpdate?: () => void
  refresh?: () => void
}

type Props = DispatchProps & StateProps & OwnProps

class ContentPickerWidget extends Component<Props> {
  state = {
    showItemEdit: false,
    contentToEdit: null
  }

  async componentDidMount() {
    await this.props.fetchContentItem(this.props.itemId)
  }

  async componentDidUpdate(prevProps) {
    if (!this.props.contentItem && prevProps.itemId !== this.props.itemId) {
      await this.props.fetchContentItem(this.props.itemId)
    }
  }

  editItem = () => {
    this.setState({ showItemEdit: true, contentToEdit: _.get(this.props, 'contentItem.formData') })
  }

  handleUpdate = async () => {
    const { contentItem, itemId } = this.props
    const { contentType } = contentItem
    await this.props
      .upsertContentItem({ modifyId: itemId, contentType, formData: this.state.contentToEdit })
      .then(() => this.setState({ showItemEdit: false }))
      .then(() => this.props.fetchContentItem(this.props.itemId, { force: true }))
      .then(this.props.refresh || (() => {}))
      .then(this.props.onUpdate || (() => {}))
  }

  onChange = async (item: ContentElement) => {
    await this.props.fetchContentItem(item?.id)
    this.props.onChange(item)
  }

  handleClose = async () => {
    if (
      CONTENT_TYPES_MEDIA.includes(this.props.contentItem.contentType) &&
      !_.isEqual(this.state.contentToEdit, this.props.contentItem.formData)
    ) {
      await this.props.deleteMedia(this.state.contentToEdit)
    }

    this.setState({ showItemEdit: false, contentToEdit: null })
  }

  renderModal() {
    const schema = _.get(this.props, 'contentItem.schema', { json: {}, ui: {} })

    return (
      <CreateOrEditModal
        show={this.state.showItemEdit}
        schema={schema.json}
        uiSchema={schema.ui}
        isEditing={this.state.contentToEdit !== null}
        handleClose={this.handleClose}
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
    const textContent =
      (contentItem && `${lang.tr(schema.title)} | ${contentItem.previews[this.props.contentLang]}`) || ''
    const actionText = (contentItem && 'say #!' + contentItem.id) || 'say '

    if (this.props.layoutv2) {
      return (
        <div onDoubleClick={() => window.botpress.pickContent({ contentType }, this.onChange)}>
          {contentItem ? (
            <ActionItem text={actionText} layoutv2 />
          ) : (
            <div
              className={style.actionBtn}
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
      <ControlGroup fill>
        <InputGroup
          placeholder={placeholder}
          value={textContent}
          disabled
          id={inputId || ''}
          className={style.contentInput}
        />
        {contentItem && <Button icon="edit" onClick={this.editItem} className={Classes.FIXED} />}
        <Button
          icon="folder-open"
          onClick={() => window.botpress.pickContent({ contentType }, this.onChange)}
          className={Classes.FIXED}
        />
        {this.renderModal()}
      </ControlGroup>
    )
  }
}

const mapDispatchToProps = { deleteMedia, fetchContentItem, upsertContentItem }
const mapStateToProps = ({ content: { itemsById } }, { itemId }) => ({ contentItem: itemsById[itemId] })

const ConnectedContentPicker = connect<DispatchProps, StateProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps
)(withLanguage(ContentPickerWidget))

// Passing store explicitly since this component may be imported from another botpress-module
export default props => <ConnectedContentPicker {...props} store={store} />
