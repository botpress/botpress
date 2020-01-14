import { Button, Classes, FormGroup, InputGroup, Intent, Tab, Tabs, TextArea } from '@blueprintjs/core'
import { Topic } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { BaseDialog } from '~/components/Shared/Interface'
import { sanitizeName } from '~/util'

import style from '../style.scss'

interface Props {
  selectedTopic: string
  isOpen: boolean
  topics: Topic[]

  toggle: () => void
  onDuplicateFlow: (flow: { flowNameToDuplicate: string; name: string }) => void
  onRenameFlow: (flow: { targetFlow: string; name: string }) => void
  updateTopics: (topics: Topic[]) => Promise<void>
}

const EditTopicModal: FC<Props> = props => {
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [tab, setTab] = useState<string>('overview')

  useEffect(() => {
    setName(props.selectedTopic)
    setTab('overview')

    if (props.topics) {
      const topic = props.topics.find(x => x.name === props.selectedTopic)
      setDescription(topic && topic.description)
    }
  }, [props.isOpen])

  const submit = async () => {
    const { topics } = props

    const index = topics.findIndex(x => x.name === props.selectedTopic)
    const newTopics = [...topics.slice(0, index), { name, description }, ...topics.slice(index + 1)]

    await props.updateTopics(newTopics)

    closeModal()
  }

  const closeModal = () => {
    setName('')
    props.toggle()
  }

  return (
    <BaseDialog
      title="Edit topic"
      icon="edit"
      isOpen={props.isOpen}
      onClose={closeModal}
      size="md"
      style={{ width: 900, minHeight: 475 }}
      onSubmit={submit}
    >
      <div className={Classes.DIALOG_BODY}>
        <Tabs id="tabs" vertical={true} onChange={tab => setTab(tab as string)} selectedTabId={tab}>
          <Tab
            id="overview"
            title="Overview"
            className={style.tabs}
            panel={
              <div>
                <FormGroup label="Topic Name">
                  <InputGroup
                    id="input-flow-name"
                    tabIndex={1}
                    required={true}
                    value={name}
                    onChange={e => setName(sanitizeName(e.currentTarget.value))}
                    autoFocus={true}
                  />
                </FormGroup>

                <FormGroup label="Description">
                  <TextArea
                    id="input-flow-name"
                    rows={3}
                    value={description}
                    fill={true}
                    onChange={e => setDescription(e.currentTarget.value)}
                  />
                </FormGroup>

                <Button
                  type="submit"
                  id="btn-submit"
                  text="Save changes"
                  intent={Intent.PRIMARY}
                  onClick={submit}
                  className={style.modalFooter}
                />
              </div>
            }
          />

          <Tab
            id="knowledge"
            title="Knowledge"
            className={style.tabs}
            panel={
              <InjectedModuleView
                moduleName="qna"
                componentName="LiteEditor"
                contentLang="en"
                extraProps={{ topicName: name }}
              />
            }
          />
        </Tabs>
      </div>
    </BaseDialog>
  )
}

export default EditTopicModal
