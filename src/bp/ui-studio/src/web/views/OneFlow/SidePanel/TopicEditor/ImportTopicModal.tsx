import { Button, Classes, Dialog, FileInput, FormGroup, InputGroup, Intent, TextArea } from '@blueprintjs/core'
import 'bluebird-global'
import _ from 'lodash'
import React, { FC, Fragment, useState } from 'react'
import { toastFailure, toastSuccess } from '~/components/Shared/Utils'

import { ExportedTopic, ImportActions } from '../typings'

import { analyzeFile, executeActions, renameTopic } from './import'

interface Props {
  onImportCompleted: () => void
  isOpen: boolean
  toggle: () => void
  flows: any
}

const ImportTopicModal: FC<Props> = props => {
  const [filePath, setFilePath] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [fileContent, setFileContent] = useState<ExportedTopic>()
  const [topicName, setTopicName] = useState('')
  const [actions, setActions] = useState<ImportActions[]>([])

  const readFile = (files: FileList | null) => {
    if (!files) {
      return
    }

    const fr = new FileReader()
    fr.readAsArrayBuffer(files[0])
    fr.onload = loadedEvent => {
      try {
        const dec = new TextDecoder('utf-8')
        setFileContent(JSON.parse(dec.decode(_.get(loadedEvent, 'target.result'))))
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
      setActions(await analyzeFile(fileContent, props.flows))
      setTopicName(fileContent?.name)
    } catch (err) {
      toastFailure(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const doImport = async () => {
    setIsLoading(true)
    try {
      const allActions: ImportActions[] = [
        ...actions,
        {
          type: 'topic',
          name: topicName,
          data: { ...fileContent, name: topicName }
        }
      ]

      renameTopic(topicName, allActions)
      console.log('RES', allActions)
      // await executeActions(allActions)

      toastSuccess(`Goal imported successfully!`)
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
    props.toggle()
  }

  const renderSummary = () => {
    if (!fileContent) {
      return null
    }

    const { name, knowledge, goals } = fileContent

    return (
      <div>
        <h4>File Summary</h4>
        Name: {name || 'N/A'}
        <br /> <br />
        <ul>
          <li>
            <strong>{knowledge?.length ?? 'N/A'}</strong> Knowledge element(s)
          </li>
          <li>
            <strong>{goals?.length ?? 'N/A'}</strong> Goals(s)
          </li>
        </ul>
      </div>
    )
  }

  const renderDetails = () => {
    const alreadyExist = props.flows.find(x => x.name === topicName)
    const actionText = actions
      .map(x => {
        if (x.existing && x.identical) {
          return `${x.type} ${x.name} already exist and is identical`
        } else if (x.existing && !x.identical) {
          return `${x.type} ${x.name} already exist but is different and will be overwritten`
        } else {
          return `${x.type} ${x.name} doesn't exist and will be created`
        }
      })
      .join('\n')

    return (
      <div>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="Topic Name" helperText="Choose a name for the topic">
            <InputGroup
              id="input-flow-name"
              tabIndex={1}
              value={topicName}
              maxLength={100}
              intent={alreadyExist ? Intent.DANGER : Intent.NONE}
              onChange={e => setTopicName(e.target.value)}
            />
          </FormGroup>
          <TextArea value={actionText} fill={true} rows={10}></TextArea>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-back"
              text={'Back'}
              disabled={isLoading}
              onClick={() => setActions([])}
              intent={Intent.NONE}
            />
            <Button
              id="btn-next"
              text={isLoading ? 'Please wait...' : 'Import'}
              disabled={alreadyExist}
              onClick={doImport}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
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
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={<span>Select your JSON file</span>} labelFor="input-archive">
            <FileInput
              text={filePath || 'Choose file...'}
              onChange={e => readFile((e.target as HTMLInputElement).files)}
              fill={true}
            />
          </FormGroup>

          {renderSummary()}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-next"
              text={isLoading ? 'Please wait...' : 'Next'}
              disabled={isLoading}
              onClick={analyzeImport}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Fragment>
      <Dialog
        title="Import Topic"
        icon="import"
        isOpen={props.isOpen}
        onClose={closeDialog}
        transitionDuration={0}
        canOutsideClickClose={false}
      >
        {!!actions?.length ? renderDetails() : renderUpload()}
      </Dialog>
    </Fragment>
  )
}

export default ImportTopicModal
