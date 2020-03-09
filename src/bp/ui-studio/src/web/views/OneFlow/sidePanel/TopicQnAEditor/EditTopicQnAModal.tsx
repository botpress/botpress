import React, { FC } from 'react'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { BaseDialog, DialogBody } from '~/components/Shared/Interface'

interface Props {
  selectedTopic: string
  isOpen: boolean
  toggle: () => void
}

const EditTopicQnAModal: FC<Props> = props => {
  return (
    <BaseDialog
      title={`Edit Q&A`}
      icon="edit"
      isOpen={props.isOpen}
      onClose={props.toggle}
      size="md"
      style={{ width: 900, minHeight: 475 }}
    >
      <DialogBody>
        <InjectedModuleView
          moduleName="qna"
          componentName="LiteEditor"
          contentLang="en"
          extraProps={{ topicName: props.selectedTopic }}
        />
      </DialogBody>
    </BaseDialog>
  )
}

export default EditTopicQnAModal
