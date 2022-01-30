import { Button, FileInput, Intent } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import { InstalledLibrary } from 'full'
import React, { FC } from 'react'

interface Props {
  lib: InstalledLibrary
  axios: any
  refreshLibraries: () => void
}

const fetchReducer = (state, action) => {
  if (action.type === 'clearState') {
    return {
      file: undefined,
      fullPath: '',
      filePath: '',
      isLoading: false,
      hasError: false
    }
  } else if (action.type === 'uploadCompleted') {
    return { ...state, isLoading: false }
  } else if (action.type === 'receivedFile') {
    const { file, filePath, fullPath } = action.data
    return { ...state, file, filePath, fullPath }
  } else if (action.type === 'updateLocation') {
    const { fullPath, alreadyExists } = action.data
    return { ...state, fullPath, alreadyExists }
  } else if (action.type === 'startUpload') {
    return { ...state, isLoading: true }
  } else if (action.type === 'showError') {
    return { ...state, isLoading: false, hasError: true }
  } else {
    throw new Error("That action type isn't supported.")
  }
}

const UploadLibrary: FC<Props> = props => {
  const [state, dispatch] = React.useReducer(fetchReducer, {
    file: undefined,
    fullPath: '',
    filePath: '',
    isLoading: false,
    hasError: false
  })

  const { file, fullPath, filePath, isLoading, hasError } = state

  const submitChanges = async () => {
    dispatch({ type: 'startUpload' })

    try {
      const form = new FormData()
      form.append('location', fullPath)
      form.append('file', file)

      await props.axios.post('/mod/code-editor/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const { data } = await props.axios.post('/mod/libraries/add', { name: file.name, uploaded: fullPath })
      dispatch({ type: 'uploadCompleted', data })

      props.refreshLibraries()
      toast.success('module.libraries.addSuccess')
    } catch (err) {
      dispatch({ type: 'showError' })
      toast.failure(err.message)
    }
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
        fullPath: `global/libraries/${files[0].name}`
      }
    })
  }

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault()
        readFile(e.dataTransfer.files)
      }}
    >
      <FileInput
        text={filePath || `${lang.tr('chooseFile')}...`}
        onChange={e => readFile((e.target as HTMLInputElement).files)}
      />

      <Button
        id="btn-submit-upload-library"
        text={isLoading ? lang.tr('pleaseWait') : lang.tr('submit')}
        disabled={isLoading || hasError || !filePath}
        onClick={submitChanges}
        intent={Intent.PRIMARY}
      />
    </div>
  )
}

export default UploadLibrary
