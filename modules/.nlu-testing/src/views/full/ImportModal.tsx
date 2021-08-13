import { Button, Classes, Colors, Dialog, FileInput, FormGroup, Icon, Intent } from '@blueprintjs/core'
import { toast } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useState } from 'react'

interface Props {
  axios: any
  onImportCompleted: () => void
  isOpen: boolean
  close: () => void
}

export const ImportModal: FC<Props> = props => {
  const [file, setFile] = useState<any>()
  const [filePath, setFilePath] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const submitChanges = async () => {
    setIsLoading(true)

    try {
      const form = new FormData()
      form.append('file', file)

      const { data } = await props.axios.post('/mod/nlu-testing/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      importSuccess(data)
    } catch (err) {
      setIsLoading(false)
      setHasError(true)
      toast.failure(err.message)
    }
  }

  const importSuccess = ({ nTests }) => {
    setIsLoading(false)
    toast.success(`Successfully imported ${nTests}`)
    props.onImportCompleted()
    setTimeout(closeDialog, 750)
  }

  const closeDialog = () => {
    clearState()
    props.close()
  }

  const clearState = () => {
    setFilePath(undefined)
    setFile(undefined)
    setHasError(false)
  }

  const readFile = (files: FileList | null) => {
    if (files) {
      setFile(files[0])
      setFilePath(files[0].name)
    }
  }

  return (
    <Dialog
      title={'Import tests'}
      icon="import"
      isOpen={props.isOpen}
      onClose={closeDialog}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          readFile(e.dataTransfer.files)
        }}
      >
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={<span>Select your CSV file</span>} labelFor="input-archive">
            <FileInput
              text={filePath || 'Choose file...'}
              onChange={e => readFile((e.target as HTMLInputElement).files)}
              fill={true}
            />
          </FormGroup>
          {!!filePath && (
            <p style={{ color: Colors.ORANGE3 }}>
              <Icon icon="warning-sign" />
              &nbsp; Importing tests will override your current tests
            </p>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-submit"
              text={isLoading ? 'Please wait...' : 'Submit'}
              disabled={isLoading || hasError}
              onClick={submitChanges}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </div>
    </Dialog>
  )
}
