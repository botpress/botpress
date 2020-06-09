import { FileInput, Icon } from '@blueprintjs/core'
import 'bluebird-global'
import { lang } from 'botpress/shared'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { toastFailure, toastSuccess } from '~/components/Shared/Utils'

import { ElementType } from '..'
import { ExportedFlow, ExportedTopic } from '../typings'
import style from '../TopicList/style.scss'
import { analyzeWorkflowFile, executeWorkflowActions, getWorkflowAction } from '../WorkflowEditor/import'

import { analyzeTopicFile, detectFileType, executeTopicActions, getTopicAction, renameTopic } from './import'

interface Topic {
  name: string
  description: string
}

interface Props {
  onImportCompleted: () => void
  isOpen: boolean
  flows: FlowView[]
  topics: Topic[]
  selectedTopic: string
}

const ImportTopic: FC<Props> = props => {
  const [fileContent, setFileContent] = useState<ExportedTopic | ExportedFlow>()

  const readFile = (files: FileList | null) => {
    if (!files) {
      return
    }

    const fr = new FileReader()
    fr.readAsArrayBuffer(files[0])
    fr.onload = loadedEvent => {
      try {
        const dec = new TextDecoder('utf-8')
        const content = JSON.parse(dec.decode(_.get(loadedEvent, 'target.result')))

        analyzeImport(content, content?.name, detectFileType(content))
          .then()
          .catch()
      } catch (err) {
        toastFailure(lang.tr('studio.flow.topicEditor.couldNotParseFile', { msg: err.message }))
        console.error(err)
      }
    }
  }

  const analyzeImport = async (content, name, detected) => {
    try {
      if (detected === ElementType.Topic) {
        // Update the flow names with the correct topic before analysis
        renameTopic(name, content)

        const actions = await analyzeTopicFile(content, props.flows)

        const topicAction = getTopicAction(
          _.pick(content, ['name', 'description']),
          props.topics.find(x => x.name === content.name)
        )
        await doImport(
          [...actions, topicAction].filter(x => !x.existing || !x.identical),
          detected
        )
      } else if (detected === ElementType.Workflow) {
        const content = fileContent as ExportedFlow

        const actions = await analyzeWorkflowFile(content, props.flows)
        const wfAction = getWorkflowAction(
          { ...content, name, location: name },
          props.flows.find(x => x.name === name)
        )

        await doImport(
          [...actions, wfAction].filter(x => !x.identical),
          detected
        )
      }
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const doImport = async (actions, detected) => {
    try {
      console.log(detected, actions)
      if (detected === ElementType.Topic) {
        await executeTopicActions(actions)
      } else {
        await executeWorkflowActions(actions)
      }

      toastSuccess(lang.tr('studio.flow.topicEditor.importedSuccessfully', { detected }))
      props.onImportCompleted()
      setFileContent(undefined)
    } catch (err) {
      console.log(err)
      toastFailure(err.message)
    }
  }

  return (
    <label className={style.inputLabel}>
      <Icon icon="import" />
      <span className={style.importInput}>
        <FileInput
          inputProps={{ accept: '.json,application/json' }}
          onChange={e => readFile((e.target as HTMLInputElement).files)}
        />
      </span>
    </label>
  )
}

export default ImportTopic
