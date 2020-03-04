import { Topic } from 'botpress/sdk'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { fetchTopics } from '~/actions'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { BaseDialog, DialogBody } from '~/components/Shared/Interface'

interface Props {
  selectedTopic: string
  isOpen: boolean
  toggle: () => void
}

const EditTopicQnAModal: FC<Props> = props => {
  const [name, setName] = useState<string>('')

  useEffect(() => {
    setName(props.selectedTopic)
  }, [props.isOpen])

  const closeModal = () => {
    props.toggle()
  }

  return (
    <BaseDialog
      title={`Edit topic - ${name}`}
      icon="edit"
      isOpen={props.isOpen}
      onClose={closeModal}
      size="md"
      style={{ width: 900, minHeight: 475 }}
    >
      <DialogBody>
        <InjectedModuleView
          moduleName="qna"
          componentName="LiteEditor"
          contentLang="en"
          extraProps={{ topicName: name }}
        />
      </DialogBody>
    </BaseDialog>
  )
}

export default EditTopicQnAModal
