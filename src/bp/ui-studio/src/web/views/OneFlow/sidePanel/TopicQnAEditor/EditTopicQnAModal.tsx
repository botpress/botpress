import React, { FC } from 'react'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { BaseDialog, DialogBody } from '~/components/Shared/Interface'
import withLanguage from '~/components/Util/withLanguage'

interface Props {
  selectedTopic: string
  contentLang: string
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
      size="lg"
      style={{ width: 1000, minHeight: 550 }}
    >
      <DialogBody>
        <InjectedModuleView
          moduleName="qna"
          componentName="LiteEditor"
          contentLang={props.contentLang}
          extraProps={{ topicName: props.selectedTopic }}
        />
      </DialogBody>
    </BaseDialog>
  )
}

export default withLanguage(EditTopicQnAModal)
