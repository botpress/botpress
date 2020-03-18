import { Button, Checkbox, FileInput, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import axios from 'axios'
import 'bluebird-global'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { BaseDialog, DialogBody, DialogFooter } from '~/components/Shared/Interface'
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
    // tslint:disable-next-line: no-floating-promises
    loadTopics()
  }, [])

  const loadTopics = async () => {
    const { data: topics } = await axios.get(`${window.BOT_API_PATH}/topics`)
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
        toastFailure(`Could not parse JSON file: ${err.message}`)
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

      toastSuccess(`${detected} imported successfully!`)
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
        <DialogBody>
          {!!missing.length && (
            <div>
              <strong>These elements don't exist and will be created</strong>
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
              <strong>These elements already exist but are different</strong>
              <div style={{ padding: 5 }}>
                <ul>
                  {existing.map(x => (
                    <li>
                      {x.type} {x.name}
                    </li>
                  ))}
                </ul>

                <Checkbox
                  label="Overwrite existing content"
                  checked={overwrite}
                  onChange={e => setOverwrite(e.currentTarget.checked)}
                />
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button id="btn-back" text="Back" disabled={isLoading} onClick={() => setActions(undefined)} />
          <Button
            id="btn-next"
            text={isLoading ? 'Please wait...' : 'Import'}
            onClick={doImport}
            intent={Intent.PRIMARY}
          />
        </DialogFooter>
      </div>
    )
  }

  const renderSummary = () => {
    if (!fileContent) {
      return null
    }

    if (detected === 'unknown') {
      return <div>Unknown file type or invalid format</div>
    }

    let alreadyExist = !!topics?.find(x => x.name === name)
    if (detected === 'workflow') {
      alreadyExist = !!props.flows.find(x => x.name === name)
    }

    return (
      <div>
        <FormGroup
          label={detected === 'topic' ? 'Topic Name' : 'Workflow Name'}
          helperText={
            alreadyExist
              ? 'An element with that name already exist. Content will be overwritten'
              : `This element doesn't exist and will be created`
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
        <h4>Content Overview</h4>
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
        <DialogBody>
          <FormGroup label={<span>Select your JSON file</span>} labelFor="input-archive">
            <FileInput
              text={filePath || 'Choose file...'}
              onChange={e => readFile((e.target as HTMLInputElement).files)}
              fill
            />
          </FormGroup>

          {renderSummary()}
        </DialogBody>
        <DialogFooter>
          {fileContent && (
            <Button
              id="btn-next"
              text={isLoading ? 'Please wait...' : 'Next'}
              disabled={isLoading}
              onClick={analyzeImport}
              intent={Intent.PRIMARY}
            />
          )}
        </DialogFooter>
      </div>
    )
  }

  const renderNoChanges = () => {
    return (
      <Fragment>
        <DialogBody>
          There are no changes to apply, or everything in the file is identical to the existing content
        </DialogBody>
        <DialogFooter>
          <Button id="btn-back" text="Back" onClick={() => setActions(undefined)} />
          <Button id="btn-close" text="Close" onClick={closeDialog} />
        </DialogFooter>
      </Fragment>
    )
  }

  return (
    <BaseDialog title="Import Content" icon="import" isOpen={props.isOpen} onClose={closeDialog}>
      {actions !== undefined ? renderDetails() : renderUpload()}
    </BaseDialog>
  )
}

export default ImportModal
