import { Button, Callout, Checkbox, Classes, Dialog, FileInput, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'

import { FilesDS } from '../../../backend/typings'
import { sanitizeName } from '../utils'

interface Props {
  files?: FilesDS
  isOpen: boolean
  toggle: () => void
  uploadFile: any
}

interface State {
  file: any
  fullPath?: string
  filePath: string
  isLoading: boolean
  hasError: boolean
  alreadyExists: boolean
  overwrite: boolean
}

const fetchReducer = (state: State, action): State => {
  if (action.type === 'clearState') {
    return {
      file: undefined,
      fullPath: '',
      filePath: '',
      isLoading: false,
      hasError: false,
      alreadyExists: false,
      overwrite: false
    }
  } else if (action.type === 'receivedFile') {
    const { file, filePath, fullPath } = action.data
    return { ...state, file, filePath, fullPath }
  } else if (action.type === 'updateLocation') {
    const { fullPath, alreadyExists } = action.data
    return { ...state, fullPath, alreadyExists }
  } else if (action.type === 'changeOverwrite') {
    const { overwrite } = action.data
    return { ...state, overwrite }
  } else if (action.type === 'startUpload') {
    return { ...state, isLoading: true }
  } else if (action.type === 'showError') {
    return { ...state, isLoading: false, hasError: true }
  } else {
    throw new Error("That action type isn't supported.")
  }
}

export const UploadModal: FC<Props> = props => {
  const [state, dispatch] = React.useReducer(fetchReducer, {
    file: undefined,
    fullPath: '',
    filePath: '',
    isLoading: false,
    hasError: false,
    alreadyExists: false,
    overwrite: false
  })

  const { file, fullPath, filePath, isLoading, hasError, alreadyExists, overwrite } = state

  const submitChanges = async () => {
    dispatch({ type: 'startUpload' })

    try {
      const form = new FormData()
      form.append('location', fullPath)
      form.append('file', file)

      await props.uploadFile(form)
      closeDialog()
    } catch (err) {
      dispatch({ type: 'hasError' })
      toast.failure(err.message)
    }
  }

  const closeDialog = () => {
    dispatch({ type: 'clearState' })
    props.toggle()
  }

  const readFile = (files: FileList | null) => {
    if (!files) {
      return
    }

    dispatch({
      type: 'receivedFile',
      data: {
        file: files[0],
        filePath: files[0].name,
        fullPath: state.fullPath.length ? state.fullPath : files[0].name
      }
    })
  }

  const toggleConfirmation = event => {
    dispatch({ type: 'changeOverwrite', data: { overwrite: event.currentTarget.checked } })
  }

  const updateLocation = text => {
    const sanitized = sanitizeName(text)
    const existing = !!props.files.raw.find(x => x.location === sanitized)

    dispatch({
      type: 'updateLocation',
      data: {
        fullPath: sanitized,
        alreadyExists: existing
      }
    })
  }

  return (
    <Dialog
      title={lang.tr('module.code-editor.uploadModal.uploadFile')}
      icon="upload"
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
          <FormGroup label={<span>{lang.tr('module.code-editor.uploadModal.selectFile')}</span>}>
            <FileInput
              text={filePath || `${lang.tr('chooseFile')}...`}
              onChange={e => readFile((e.target as HTMLInputElement).files)}
              fill={true}
            />
          </FormGroup>

          <FormGroup
            label={lang.tr('module.code-editor.uploadModal.completeFilePath')}
            helperText={lang.tr('module.code-editor.uploadModal.filePathHelp')}
          >
            <InputGroup
              id="input-name"
              tabIndex={1}
              placeholder="global/actions/my-file.js"
              value={fullPath}
              onChange={e => updateLocation(e.currentTarget.value)}
              required
              autoFocus
            />
          </FormGroup>

          {alreadyExists && (
            <Callout intent={Intent.DANGER} title={lang.tr('module.code-editor.store.alreadyExists')}>
              <Checkbox
                label={lang.tr('module.code-editor.uploadModal.overwrite')}
                onClick={toggleConfirmation}
                checked={overwrite}
              />
            </Callout>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-submit-upload"
              text={isLoading ? lang.tr('pleaseWait') : lang.tr('submit')}
              disabled={isLoading || hasError || (alreadyExists && !overwrite)}
              onClick={submitChanges}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </div>
    </Dialog>
  )
}
