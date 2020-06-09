import { Button, FileInput, Icon, Intent, Position, Tooltip } from '@blueprintjs/core'
import React, { FC, Fragment, useReducer } from 'react'

import { lang } from '../../../translations'
import style from '../style.scss'
import { FieldProps } from '../typings'

interface UploadFieldProps extends FieldProps {
  axios: any
  customPath?: string
}

const Upload: FC<UploadFieldProps> = props => {
  const uploadReducer = (state, action) => {
    if (action.type === 'uploadStart') {
      return {
        ...state,
        error: null,
        uploading: true
      }
    } else if (action.type === 'deleteFile') {
      props.onChange?.(null)
      return {
        ...state,
        error: null,
        uploading: false
      }
    } else if (action.type === 'uploadError') {
      const { error } = action.data

      return {
        ...state,
        error,
        uploading: false
      }
    } else if (action.type === 'uploadSuccess') {
      const { url } = action.data

      props.onChange?.(url)
      return {
        ...state,
        error: null,
        uploading: false
      }
    } else {
      throw new Error(`That action type isn't supported.`)
    }
  }

  const [state, dispatch] = useReducer(uploadReducer, {
    error: null,
    uploading: false
  })

  const { error, uploading } = state

  const deleteFile = () => {
    dispatch({ type: 'deleteFile' })
  }

  const startUpload = async event => {
    const data = new FormData()
    data.append('file', event.target.files[0])

    dispatch({ type: 'uploadStart' })
    await props.axios
      .post(props.customPath ? props.customPath : `media`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(response => {
        const { url } = response.data

        dispatch({ type: 'uploadSuccess', data: { url } })
      })
      .catch(e => {
        dispatch({ type: 'uploadError', data: { error: e.message } })
      })
  }

  const { value } = props

  return (
    <div className={style.fieldWrapper}>
      {value && (
        <div style={{ backgroundImage: `url('${value}')` }} className={style.imgWrapper}>
          <div className={style.imgWrapperActions}>
            <Tooltip content={lang('delete')} position={Position.TOP}>
              <Button
                className={style.deleteImg}
                minimal
                small
                intent={Intent.DANGER}
                icon="trash"
                onClick={deleteFile}
              ></Button>
            </Tooltip>
          </div>
        </div>
      )}
      {!value && (
        <Fragment>
          <FileInput
            text={<Icon icon="upload" />}
            large
            inputProps={{
              id: 'node-image',
              name: 'nodeImage',
              accept: 'image/*',
              onChange: startUpload
            }}
          />
          {error && <p className={style.fieldError}>{error}</p>}
        </Fragment>
      )}
    </div>
  )
}

export default Upload
