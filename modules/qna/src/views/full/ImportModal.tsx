import { Button, Callout, Classes, Dialog, FileInput, FormGroup, Intent, Radio, RadioGroup } from '@blueprintjs/core'
import 'bluebird-global'
import { toastFailure, toastSuccess } from 'botpress/utils'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

const JSON_STATUS_POLL_INTERVAL = 1000
const axiosConfig = { headers: { 'Content-Type': 'multipart/form-data' } }

interface Props {
  axios: any
  onImportCompleted: () => void
  isOpen: boolean
  toggle: () => void
}

interface Analysis {
  qnaCount: number
  cmsCount: number
  fileQnaCount: number
  fileCmsCount: number
}

export const ImportModal: FC<Props> = props => {
  const [file, setFile] = useState<any>()
  const [filePath, setFilePath] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [importAction, setImportAction] = useState('insert')
  const [analysis, setAnalysis] = useState<Analysis>()
  const [statusId, setStatusId] = useState<string>()
  const [uploadStatus, setUploadStatus] = useState<string>()
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (statusId) {
      const interval = setInterval(async () => {
        await updateUploadStatus()
      }, JSON_STATUS_POLL_INTERVAL)
      return () => clearInterval(interval)
    }
  }, [statusId])

  const analyzeImport = async () => {
    setIsLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)

      const { data } = await props.axios.post('/mod/qna/analyzeImport', form, axiosConfig)

      if (!data.fileQnaCount && !data.fileCmsCount) {
        setUploadStatus(`We were not able to extract any data from your file.
Either the file is empty, or it doesn't match any known format.`)
        setHasError(true)
      }

      setAnalysis(data)
    } catch (err) {
      toastFailure(err.message)
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

      const { data } = await props.axios.post(`/mod/qna/import`, form, axiosConfig)
      setStatusId(data)
    } catch (err) {
      clearStatus()
      setHasError(true)
      toastFailure(err.message)
    }
  }

  const updateUploadStatus = async () => {
    const { data: status } = await props.axios.get(`/mod/qna/json-upload-status/${statusId}`)
    setUploadStatus(status)

    if (status === 'Completed') {
      clearStatus()
      closeDialog()
      toastSuccess('Upload successful')
      props.onImportCompleted()
    } else if (status.startsWith('Error')) {
      clearStatus()
      setHasError(true)
    }
  }

  const readFile = (files: FileList | null) => {
    if (files) {
      setFile(files[0])
      setFilePath(files[0].name)
    }
  }

  const clearStatus = () => {
    setStatusId(undefined)
    setIsLoading(false)
  }

  const closeDialog = () => {
    clearState()
    props.toggle()
  }

  const clearState = () => {
    setFilePath(undefined)
    setFile(undefined)
    setUploadStatus(undefined)
    setStatusId(undefined)
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
            labelFor="input-archive"
            helperText={
              <span>
                Select a JSON file exported from the module QNA. You will see a summary of modifications when clicking
                on Next
              </span>
            }
          >
            <FileInput
              text={filePath || 'Choose file...'}
              onChange={e => readFile((e.target as HTMLInputElement).files)}
              inputProps={{ accept: '.json' }}
              fill
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
    const { qnaCount, cmsCount, fileQnaCount, fileCmsCount } = analysis

    return (
      <Fragment>
        <div className={Classes.DIALOG_BODY}>
          <div>
            <p>
              Your file contains <strong>{fileQnaCount}</strong> questions and <strong>{fileCmsCount}</strong> content
              elements.
              <br />
              <br />
              The bot contains <strong>{qnaCount}</strong> questions and <strong>{cmsCount}</strong> content elements.
            </p>

            <p style={{ marginTop: 30 }}>
              <RadioGroup
                label=" What would you like to do? "
                onChange={e => setImportAction(e.target['value'])}
                selectedValue={importAction}
              >
                <Radio
                  id="radio-insert"
                  label="Insert the new questions from my file and create/update associated content elements"
                  value="insert"
                />
                <Radio
                  id="radio-clearInsert"
                  label="Clear existing questions, then insert my new questions and create/update content elements"
                  value="clear_insert"
                />
              </RadioGroup>
            </p>
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
      <Dialog
        title={analysis ? 'Analysis' : 'Upload File'}
        icon="import"
        isOpen={props.isOpen}
        onClose={closeDialog}
        transitionDuration={0}
      >
        {showStatus && renderStatus()}
        {!showStatus && (analysis ? renderAnalysis() : renderUpload())}
      </Dialog>
    </Fragment>
  )
}
