import { Button, FileInput, FormGroup, Intent } from '@blueprintjs/core'
import { Dialog } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

interface Props {
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

      const { data } = await api.getSecured().post(`/modules/import`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      importSuccess(data)
    } catch (err) {
      setIsLoading(false)
      setHasError(true)
      toastFailure(err.message)
    }
  }

  const importSuccess = ({ nTests }) => {
    setIsLoading(false)
    toastSuccess(`Successfully imported module`)
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
    <Dialog.Wrapper title={'Upload Module'} icon="import" isOpen={props.isOpen} onClose={closeDialog}>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          readFile(e.dataTransfer.files)
        }}
      >
        <Dialog.Body>
          <FormGroup label={<span>Select your module file</span>} labelFor="input-archive">
            <FileInput
              text={filePath || 'Choose file...'}
              onChange={e => readFile((e.target as HTMLInputElement).files)}
              fill
            />
          </FormGroup>
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            id="btn-submit"
            text={isLoading ? 'Please wait...' : 'Submit'}
            disabled={isLoading || hasError}
            onClick={submitChanges}
            intent={Intent.PRIMARY}
          />
        </Dialog.Footer>
      </div>
    </Dialog.Wrapper>
  )
}
