import { Button, Callout, Classes, Dialog, FileInput, FormGroup, Intent, Radio, RadioGroup } from '@blueprintjs/core'
import 'bluebird-global'
import { lang } from 'botpress/shared'
import { toastFailure, toastSuccess } from 'botpress/utils'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

const JSON_STATUS_POLL_INTERVAL = 1000
const axiosConfig = { headers: { 'Content-Type': 'multipart/form-data' } }

interface Props {
  axios: any
  topicName: string
  onImportCompleted: () => void
  isOpen: boolean
  toggle: () => void
}

export const ImportModal: FC<Props> = props => {
  const [file, setFile] = useState<any>()
  const [filePath, setFilePath] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [importAction, setImportAction] = useState('insert')
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

  const importTar = async () => {
    setIsLoading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('action', importAction)

      const { data } = await props.axios.post(`/mod/qna/${props.topicName}/import`, form, axiosConfig)
      setStatusId(data)
    } catch (err) {
      clearStatus()
      setHasError(true)
      toastFailure(err.message)
    }
  }

  const updateUploadStatus = async () => {
    const { data: status } = await props.axios.get(`/mod/qna/json-upload-status/${statusId}`)
    setUploadStatus(lang.tr(status))
    if (status === 'Completed') {
      clearStatus()
      closeDialog()
      toastSuccess(lang.tr('module.qna.import.uploadSuccessful'))
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
            label={<span>{lang.tr('module.qna.import.selectJson')}</span>}
            labelFor="input-archive"
            helperText={<span>{lang.tr('module.qna.import.selectJsonHelp')}</span>}
          >
            <FileInput
              text={filePath || lang.tr('chooseFile')}
              onChange={e => readFile((e.target as HTMLInputElement).files)}
              inputProps={{ accept: '.tar.gz' }}
              fill
            />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-next"
              text={isLoading ? lang.tr('pleaseWait') : lang.tr('submit')}
              disabled={!filePath || !file || isLoading}
              onClick={importTar}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderStatus = () => {
    return (
      <Fragment>
        <div className={Classes.DIALOG_BODY}>
          <Callout
            title={hasError ? lang.tr('error') : lang.tr('module.qna.import.uploadStatus')}
            intent={hasError ? Intent.DANGER : Intent.PRIMARY}
          >
            {uploadStatus}
          </Callout>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            {hasError && <Button id="btn-back" text={lang.tr('back')} disabled={isLoading} onClick={clearState} />}
          </div>
        </div>
      </Fragment>
    )
  }

  const showStatus = uploadStatus || hasError

  return (
    <Fragment>
      <Dialog
        title={lang.tr('module.qna.import.uploadFile')}
        icon="import"
        isOpen={props.isOpen}
        onClose={closeDialog}
        transitionDuration={0}
      >
        {showStatus && renderStatus()}
        {!showStatus && renderUpload()}
      </Dialog>
    </Fragment>
  )
}
