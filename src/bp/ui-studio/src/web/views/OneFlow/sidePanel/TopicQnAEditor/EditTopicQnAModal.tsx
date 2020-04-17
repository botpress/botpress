import { Dialog, lang } from 'botpress/shared'
import React, { FC } from 'react'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import withLanguage from '~/components/Util/withLanguage'
interface Props {
  selectedTopic: string
  contentLang: string
  isOpen: boolean
  toggle: () => void
}

const EditTopicQnAModal: FC<Props> = props => {
  return (
    <Dialog.Wrapper
      title={lang.tr('studio.flow.editQna')}
      icon="edit"
      isOpen={props.isOpen}
      onClose={props.toggle}
      size="lg"
      style={{ width: 1000, minHeight: 550 }}
    >
      <Dialog.Body>
        <InjectedModuleView
          moduleName="qna"
          componentName="LiteEditor"
          contentLang={props.contentLang}
          extraProps={{ topicName: props.selectedTopic }}
        />
      </Dialog.Body>
    </Dialog.Wrapper>
  )
}

export default withLanguage(EditTopicQnAModal)
