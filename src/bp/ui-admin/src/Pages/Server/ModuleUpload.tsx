import { Button, FileInput, FormGroup, Intent } from '@blueprintjs/core'
import { Dialog } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

interface Props {
  onImportCompleted: () => void
  isOpen: boolean
  close: () => void
}

interface State {
  file: any
  filePath: string
  isLoading: boolean
  hasError: boolean
}

const reducer = (state: State, action): State => {
  if (action.type === 'clearState') {
    return {
      file: undefined,
      filePath: '',
      isLoading: false,
      hasError: false
    }
  } else if (action.type === 'receivedFile') {
    const { file, filePath } = action.data
    return { ...state, file, filePath }
  } else if (action.type === 'startUpload') {
    return { ...state, isLoading: true }
  } else if (action.type === 'showError') {
    return { ...state, isLoading: false, hasError: true }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

export const ImportModal: FC<Props> = props => {
  const [state, dispatch] = React.useReducer(reducer, {
    file: undefined,
    filePath: '',
    isLoading: false,
    hasError: false
  })

  const { file, filePath, isLoading, hasError } = state

  const submitChanges = async () => {
    dispatch({ type: 'startUpload' })

    try {
      const form = new FormData()
      form.append('file', file)

      await api.getSecured().post(`/modules/import`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toastSuccess(`Successfully imported module`)
      props.onImportCompleted()
      closeDialog()
    } catch (err) {
      dispatch({ type: 'hasError' })
      toastFailure(err.message)
    }
  }

  const closeDialog = () => {
    dispatch({ type: 'clearState' })
    props.close()
  }

  const readFile = (files: FileList | null) => {
    if (files) {
      dispatch({ type: 'receivedFile', data: { file: files[0], filePath: files[0].name } })
    }
  }

  return (
    <Dialog.Wrapper title="Upload Module" icon="upload" isOpen={props.isOpen} onClose={closeDialog}>
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
