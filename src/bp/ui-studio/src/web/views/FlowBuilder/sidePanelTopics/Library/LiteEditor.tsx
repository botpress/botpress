import { ContentElement } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { fetchContentItem, refreshLibrary, upsertContentItem } from '~/actions'
import withLanguage from '~/components/Util/withLanguage'

import CreateOrEditModal from '../../../../components/Content/CreateOrEditModal'

type ContentElementSchema = ContentElement & {
  schema?: {
    json: any
    ui: any
  }
}

interface DispatchProps {
  fetchContentItem: (itemId: string, query?: any) => Promise<void>
  upsertContentItem: (item: any) => Promise<void>
  refreshLibrary: () => void
}

interface StateProps {
  contentItem: ContentElementSchema
  contentType: string
  contentLang: string
}

interface OwnProps {
  isOpen: boolean
  itemId: string
  toggle?: () => void
}

type Props = DispatchProps & StateProps & OwnProps

const ContentEdit: FC<Props> = props => {
  const [formData, setFormData] = useState()

  const { contentItem, itemId } = props

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    props.fetchContentItem(props.itemId)
  }, [props.itemId])

  const handleUpdate = async () => {
    await props.upsertContentItem({ modifyId: itemId, contentType: contentItem.contentType, formData })
    await props.fetchContentItem(props.itemId, { force: true })
    await props.refreshLibrary()
    props.toggle()
  }

  if (!props.contentItem) {
    return null
  }

  return (
    <CreateOrEditModal
      show={props.isOpen}
      schema={contentItem.schema?.json || {}}
      uiSchema={contentItem.schema?.ui || {}}
      handleClose={props.toggle}
      formData={props.contentItem.formData}
      handleEdit={contentToEdit => setFormData(contentToEdit)}
      handleCreateOrUpdate={handleUpdate}
    />
  )
}

const mapStateToProps = ({ content: { itemsById } }, { itemId }) => ({ contentItem: itemsById[itemId] })

export default connect<DispatchProps, StateProps, OwnProps>(mapStateToProps, {
  upsertContentItem,
  fetchContentItem,
  refreshLibrary
})(withLanguage(ContentEdit))
