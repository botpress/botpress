import { Button, Callout, Classes, Dialog, FileInput, FormGroup, Intent, Radio, RadioGroup } from '@blueprintjs/core'
import axios from 'axios'
import 'bluebird-global'
import _ from 'lodash'
import React, { FC, Fragment, useState } from 'react'
import { AccessControl, toastFailure } from '~/components/Shared/Utils'

const axiosConfig = { headers: { 'Content-Type': 'multipart/form-data' } }

interface Props {
  onImportCompleted: () => void
}

interface Analysis {
  cmsCount: number
  fileCmsCount: number
}

export const ImportModal: FC<Props> = props => {
  const [file, setFile] = useState<any>()
  const [filePath, setFilePath] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [importAction, setImportAction] = useState('insert')
  const [analysis, setAnalysis] = useState<Analysis>()
  const [uploadStatus, setUploadStatus] = useState<string>()
  const [hasError, setHasError] = useState(false)

  const analyzeImport = async () => {
    setIsLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)

      const { data } = await axios.post(`${window.BOT_API_PATH}/content/analyzeImport`, form, axiosConfig)

      if (!data.fileCmsCount) {
        setUploadStatus(`We were not able to extract any data from your file.
Either the file is empty, or it doesn't match any known format.`)
        setHasError(true)
      }

      if (data.missingContentTypes.length) {
        setUploadStatus(`Your bot is missing these content types: ${data.missingContentTypes.join(', ')}.`)
        setHasError(true)
      }

      setAnalysis(data)
    } catch (err) {
      toastFailure(_.get(err, 'response.data.message', err.message))
    } finally {
      setIsLoading(false)
    }
  }

  const submitChanges = async () => {
    setIsLoading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('action', importAction)

      await axios.post(`${window.BOT_API_PATH}/content/import`, form, axiosConfig)
      closeDialog()
      props.onImportCompleted()
    } catch (err) {
      clearStatus()
      setHasError(true)
      toastFailure(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const readFile = (files: FileList | null) => {
    if (files) {
      setFile(files[0])
      setFilePath(files[0].name)
    }
  }

  const clearStatus = () => {
    setIsLoading(false)
  }

  const closeDialog = () => {
    clearState()
    setDialogOpen(false)
  }

  const clearState = () => {
    setFilePath(undefined)
    setFile(undefined)
    setUploadStatus(undefined)

    setAnalysis(undefined)
    setHasError(false)
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
          <FormGroup
            label={<span>Select your JSON file</span>}
            labelFor="input-json"
            helperText={
              <span>
                Select a JSON file. It must be exported from the Content page. You will see a summary of modifications
                when clicking on Next
              </span>
            }
          >
            <FileInput
              text={filePath || 'Choose file...'}
              onChange={e => readFile((e.target as HTMLInputElement).files)}
              inputProps={{ accept: '.json' }}
              fill={true}
            />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-next"
              text={isLoading ? 'Please wait...' : 'Next'}
              disabled={!filePath || !file || isLoading}
              onClick={analyzeImport}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderAnalysis = () => {
    const { cmsCount, fileCmsCount } = analysis

    return (
      <Fragment>
        <div className={Classes.DIALOG_BODY}>
          <div>
            <p>
              Your file contains <strong>{fileCmsCount}</strong> content elements, while this bot contains{' '}
              <strong>{cmsCount}</strong> elements.
            </p>

            <div style={{ marginTop: 30 }}>
              <RadioGroup
                label=" What would you like to do? "
                onChange={e => setImportAction(e.target['value'])}
                selectedValue={importAction}
              >
                <Radio id="radio-insert" label="Update or create missing elements present in my file" value="insert" />
                <Radio
                  id="radio-clearInsert"
                  label="Clear all existing elements, them import those from my file"
                  value="clear_insert"
                />
              </RadioGroup>
            </div>
          </div>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button id="btn-back" text={'Back'} disabled={isLoading} onClick={clearState} />
            <Button
              id="btn-submit"
              text={isLoading ? 'Please wait...' : 'Submit'}
              disabled={isLoading || hasError}
              onClick={submitChanges}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </Fragment>
    )
  }

  const renderStatus = () => {
    return (
      <Fragment>
        <div className={Classes.DIALOG_BODY}>
          <Callout title={hasError ? 'Error' : 'Upload status'} intent={hasError ? Intent.DANGER : Intent.PRIMARY}>
            {uploadStatus}
          </Callout>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            {hasError && <Button id="btn-back" text={'Back'} disabled={isLoading} onClick={clearState} />}
          </div>
        </div>
      </Fragment>
    )
  }

  const showStatus = uploadStatus || hasError

  return (
    <Fragment>
      <AccessControl resource="content" operation="write">
        <Button icon="download" id="btn-importJson" text="Import JSON" onClick={() => setDialogOpen(true)} />
      </AccessControl>

      <Dialog
        title={analysis ? 'Analysis' : 'Upload File'}
        icon="import"
        isOpen={isDialogOpen}
        onClose={closeDialog}
        transitionDuration={0}
        canOutsideClickClose={false}
      >
        {showStatus && renderStatus()}
        {!showStatus && (analysis ? renderAnalysis() : renderUpload())}
      </Dialog>
    </Fragment>
  )
}
