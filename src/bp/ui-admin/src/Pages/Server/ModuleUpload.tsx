import { Button, Callout, FileInput, FormGroup, Intent } from '@blueprintjs/core'
import { ModuleDefinition } from 'botpress/sdk'
import { Dialog } from 'botpress/shared'
import { lang } from 'botpress/shared'
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
  moduleInfo?: ModuleDefinition & { version: string; description: string }
}

const reducer = (state: State, action): State => {
  const { type, data } = action
  if (type === 'clearState') {
    return {
      file: undefined,
      moduleInfo: undefined,
      filePath: '',
      isLoading: false
    }
  } else if (type === 'receivedFile') {
    const { file, filePath } = action.data
    return { ...state, file, filePath }
  } else if (type === 'startUpload') {
    return { ...state, isLoading: true }
  } else if (type === 'uploadSuccess') {
    return { ...state, isLoading: false, moduleInfo: data }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

export const ImportModal: FC<Props> = props => {
  const [state, dispatch] = React.useReducer(reducer, {
    file: undefined,
    filePath: '',
    isLoading: false
  })

  const { file, filePath, isLoading, moduleInfo } = state

  const submitChanges = async () => {
    dispatch({ type: 'startUpload' })

    try {
      const form = new FormData()
      form.append('file', file)

      const { data } = await api.getSecured().post(`/modules/import`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      dispatch({ type: 'uploadSuccess', data })
      props.onImportCompleted()
    } catch (err) {
      toastFailure(_.get(err, 'response.data', err.message))
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
    <Dialog.Wrapper
      title={lang.tr('admin.modules.uploadModule')}
      icon="upload"
      isOpen={props.isOpen}
      onClose={closeDialog}
    >
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          readFile(e.dataTransfer.files)
        }}
      >
        <Dialog.Body>
          {moduleInfo ? (
            <Callout intent={Intent.SUCCESS} title={lang.tr('admin.modules.uploadSuccess')}>
              <strong> {moduleInfo.fullName}</strong> (v{moduleInfo.version}) <br></br>
              {moduleInfo.description}
            </Callout>
          ) : (
            <div>
              <p>{lang.tr('admin.modules.uploadInfo')}</p>
              <FormGroup label={<span>{lang.tr('admin.modules.selectArchive')}</span>} labelFor="input-archive">
                <FileInput
                  text={filePath || lang.tr('chooseFile')}
                  onChange={e => readFile((e.target as HTMLInputElement).files)}
                  fill
                />
              </FormGroup>
            </div>
          )}
        </Dialog.Body>
        <Dialog.Footer>
          {moduleInfo ? (
            <Button id="btn-close" text={lang.tr('close')} onClick={closeDialog} intent={Intent.DANGER} />
          ) : (
            <Button
              id="btn-submit"
              text={isLoading ? lang.tr('pleaseWait') : lang.tr('submit')}
              disabled={isLoading}
              onClick={submitChanges}
              intent={Intent.PRIMARY}
            />
          )}
        </Dialog.Footer>
      </div>
    </Dialog.Wrapper>
  )
}
