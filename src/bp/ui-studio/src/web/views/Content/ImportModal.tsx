import { Button, Callout, Classes, Dialog, FileInput, FormGroup, Intent, Radio, RadioGroup } from '@blueprintjs/core'
import axios from 'axios'
import 'bluebird-global'
import { lang } from 'botpress/shared'
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
        setUploadStatus(lang.tr('studio.content.import.notAbleToExtractData'))
        setHasError(true)
      }

      if (data.missingContentTypes.length) {
        setUploadStatus(
          lang.tr('studio.content.import.missingContentTypes', { types: data.missingContentTypes.join(', ') })
        )
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
            label={<span>{lang.tr('studio.content.import.selectFile')}</span>}
            labelFor="input-json"
            helperText={<span>{lang.tr('studio.content.import.selectFileMore')}</span>}
          >
            <FileInput
              text={filePath || lang.tr('chooseFile')}
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
              text={isLoading ? lang.tr('pleaseWait') : lang.tr('next')}
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
              {lang.tr('studio.content.import.compareNbElements', {
                fileCmsCount: <strong>{fileCmsCount}</strong>,
                cmsCount: <strong>{cmsCount}</strong>
              })}
            </p>

            <div style={{ marginTop: 30 }}>
              <RadioGroup
                label={lang.tr('studio.content.import.whatLikeDo')}
                onChange={e => setImportAction(e.target['value'])}
                selectedValue={importAction}
              >
                <Radio id="radio-insert" label={lang.tr('studio.content.import.updateMissing')} value="insert" />
                <Radio
                  id="radio-clearInsert"
                  label={lang.tr('studio.content.import.clearExisting')}
                  value="clear_insert"
                />
              </RadioGroup>
            </div>
          </div>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button id="btn-back" text={lang.tr('back')} disabled={isLoading} onClick={clearState} />
            <Button
              id="btn-submit"
              text={isLoading ? lang.tr('pleaseWait') : lang.tr('submit')}
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
          <Callout
            title={hasError ? lang.tr('error') : lang.tr('studio.content.import.uploadStatus')}
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
      <AccessControl resource="content" operation="write">
        <Button
          icon="download"
          id="btn-importJson"
          text={lang.tr('studio.content.import.import')}
          onClick={() => setDialogOpen(true)}
        />
      </AccessControl>

      <Dialog
        title={analysis ? lang.tr('studio.content.import.analysis') : lang.tr('studio.content.import.upload')}
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
