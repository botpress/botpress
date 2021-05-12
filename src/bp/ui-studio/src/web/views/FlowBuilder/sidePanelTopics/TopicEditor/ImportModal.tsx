import { Button, Checkbox, FileInput, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import axios from 'axios'
import 'bluebird-global'
import { Dialog, lang } from 'botpress/shared'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { toastFailure, toastSuccess } from '~/components/Shared/Utils'

import { ElementType } from '..'
import { ExportedFlow, ExportedTopic, ImportAction } from '../typings'
import { analyzeWorkflowFile, executeWorkflowActions, getWorkflowAction } from '../WorkflowEditor/import'

import { analyzeTopicFile, detectFileType, executeTopicActions, fields, getTopicAction, renameTopic } from './import'

interface Topic {
  name: string
  description: string
}

interface Props {
  onImportCompleted: () => void
  isOpen: boolean
  toggle: () => void
  flows: FlowView[]
  topics: Topic[]
  selectedTopic: string
}

const ImportModal: FC<Props> = props => {
  const [filePath, setFilePath] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [fileContent, setFileContent] = useState<ExportedTopic | ExportedFlow>()
  const [topics, setTopics] = useState<Topic[]>([])
  const [actions, setActions] = useState<ImportAction[]>(undefined)
  const [overwrite, setOverwrite] = useState(false)
  const [detected, setDetected] = useState<ElementType>(ElementType.Unknown)
  const [name, setName] = useState('')

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadTopics()
  }, [])

  const loadTopics = async () => {
    const { data: topics } = await axios.get(`${window.STUDIO_API_PATH}/topics`)
    setTopics(topics)
  }

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

        setFileContent(content)
        setName(content?.name)
        setDetected(detectFileType(content))
      } catch (err) {
        toastFailure(lang.tr('studio.flow.topicEditor.couldNotParseFile', { msg: err.message }))
        console.error(err)
      }
    }
    setFilePath(files[0].name)
  }

  const analyzeImport = async () => {
    setIsLoading(true)
    try {
      if (detected === ElementType.Topic) {
        const content = fileContent as ExportedTopic

        // Update the flow names with the correct topic before analysis
        renameTopic(name, content)

        const actions = await analyzeTopicFile(content, props.flows)

        const topicAction = getTopicAction(
          _.pick(content, ['name', 'description']),
          props.topics.find(x => x.name === content.name)
        )

        setActions([...actions, topicAction].filter(x => !x.existing || !x.identical))
      } else if (detected === ElementType.Workflow) {
        const content = fileContent as ExportedFlow

        const actions = await analyzeWorkflowFile(content, props.flows)
        const wfAction = getWorkflowAction(
          { ...content, name, location: name },
          props.flows.find(x => x.name === name)
        )

        setActions([...actions, wfAction].filter(x => !x.identical))
      }
    } catch (err) {
      toastFailure(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const doImport = async () => {
    setIsLoading(true)
    try {
      if (detected === ElementType.Topic) {
        await executeTopicActions(actions)
      } else {
        await executeWorkflowActions(actions)
      }

      toastSuccess(lang.tr('studio.flow.topicEditor.importedSuccessfully', { detected }))
      props.onImportCompleted()
      closeDialog()
    } catch (err) {
      toastFailure(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const closeDialog = () => {
    setFilePath(undefined)
    setFileContent(undefined)
    setActions(undefined)
    props.toggle()
  }

  const renderDetails = () => {
    if (!actions.length) {
      return renderNoChanges()
    }

    const missing = actions.filter(x => !x.existing)
    const existing = actions.filter(x => x.existing && !x.identical)

    return (
      <div>
        <Dialog.Body>
          {!!missing.length && (
            <div>
              <strong>{lang.tr('studio.flow.topicEditor.dontExisteWillCreate')}</strong>
              <div style={{ padding: 5 }}>
                <ul>
                  {missing.map(x => (
                    <li>
                      {x.type} {x.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!!existing.length && (
            <div>
              <strong>{lang.tr('studio.flow.topicEditor.alreadyExistButDifferent')}</strong>
              <div style={{ padding: 5 }}>
                <ul>
                  {existing.map(x => (
                    <li>
                      {x.type} {x.name}
                    </li>
                  ))}
                </ul>

                <Checkbox
                  label={lang.tr('studio.flow.topicEditor.overwrite')}
                  checked={overwrite}
                  onChange={e => setOverwrite(e.currentTarget.checked)}
                />
              </div>
            </div>
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Button id="btn-back" text={lang.tr('back')} disabled={isLoading} onClick={() => setActions(undefined)} />
          <Button
            id="btn-next"
            text={isLoading ? lang.tr('pleaseWait') : lang.tr('import')}
            onClick={doImport}
            intent={Intent.PRIMARY}
          />
        </Dialog.Footer>
      </div>
    )
  }

  const renderSummary = () => {
    if (!fileContent) {
      return null
    }

    if (detected === 'unknown') {
      return <div>{lang.tr('studio.flow.topicEditor.unknownFileType')}</div>
    }

    let alreadyExist = !!topics?.find(x => x.name === name)
    if (detected === 'workflow') {
      alreadyExist = !!props.flows.find(x => x.name === name)
    }

    return (
      <div>
        <FormGroup
          label={
            detected === 'topic'
              ? lang.tr('studio.flow.topicEditor.topicName')
              : lang.tr('studio.flow.topicEditor.workflowName')
          }
          helperText={
            alreadyExist
              ? lang.tr('studio.flow.topicEditor.willBeOverwritten')
              : lang.tr('studio.flow.topicEditor.willBeCreated')
          }
        >
          <InputGroup
            id="input-flow-name"
            tabIndex={1}
            value={name}
            maxLength={100}
            onChange={e => setName(e.target.value)}
          />
        </FormGroup>
        <h4>{lang.tr('studio.flow.topicEditor.contentOverview')}</h4>
        <ul>
          {Object.keys(fields[detected]).map(field => {
            const count = fileContent[field]?.length
            return (
              <li>
                <strong>{count ?? 'N/A'}</strong> {fields[detected][field]}
                {count > 1 && 's'}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const renderUpload = () => {
    return (
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          readFile(e.dataTransfer.files)
        }}
      >
        <Dialog.Body>
          <FormGroup label={<span>{lang.tr('studio.flow.topicEditor.selectJson')}</span>} labelFor="input-archive">
            <FileInput
              text={filePath || lang.tr('chooseFile')}
              onChange={e => readFile((e.target as HTMLInputElement).files)}
              fill
            />
          </FormGroup>

          {renderSummary()}
        </Dialog.Body>
        <Dialog.Footer>
          {fileContent && (
            <Button
              id="btn-next"
              text={isLoading ? lang.tr('pleaseWait') : lang.tr('next')}
              disabled={isLoading}
              onClick={analyzeImport}
              intent={Intent.PRIMARY}
            />
          )}
        </Dialog.Footer>
      </div>
    )
  }

  const renderNoChanges = () => {
    return (
      <Fragment>
        <Dialog.Body>{lang.tr('studio.flow.topicEditor.noChangesToApply')}</Dialog.Body>
        <Dialog.Footer>
          <Button id="btn-back" text={lang.tr('back')} onClick={() => setActions(undefined)} />
          <Button id="btn-close" text={lang.tr('close')} onClick={closeDialog} />
        </Dialog.Footer>
      </Fragment>
    )
  }

  return (
    <Dialog.Wrapper
      title={lang.tr('studio.flow.topicEditor.importContent')}
      icon="import"
      isOpen={props.isOpen}
      onClose={closeDialog}
    >
      {actions !== undefined ? renderDetails() : renderUpload()}
    </Dialog.Wrapper>
  )
}

export default ImportModal
