import { BaseDialog, lang } from 'botpress/shared'
import React, { FC } from 'react'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import withLanguage from '~/components/Util/withLanguage'

const { Dialog, DialogBody } = BaseDialog

interface Props {
  selectedTopic: string
  contentLang: string
  isOpen: boolean
  toggle: () => void
}

const EditTopicQnAModal: FC<Props> = props => {
  return (
    <Dialog
      title={lang.tr('studio.flow.editQna')}
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
    </Dialog>
  )
}

export default withLanguage(EditTopicQnAModal)
