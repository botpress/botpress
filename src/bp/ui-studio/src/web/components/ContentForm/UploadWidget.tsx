import { Button, FileInput, Intent, Position, Tooltip } from '@blueprintjs/core'
import axios from 'axios'
import React, { FC, Fragment, useEffect, useReducer } from 'react'
import { AccessControl } from '~/components/Shared/Utils'
import style from '~/views/OneFlow/sidePanel/form/style.scss'

const UploadWidget: FC<any> = props => {
  const uploadReducer = (state, action) => {
    if (action.type === 'uploadStart') {
      return {
        ...state,
        error: null,
        uploading: true
      }
    } else if (action.type === 'changeShowUploadBtn') {
      const { showUploadBtn } = action.data

      return {
        ...state,
        showUploadBtn
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

      props.onChange(url)
      return {
        ...state,
        showUploadBtn: false,
        error: null,
        uploading: false
      }
    } else {
      throw new Error(`That action type isn't supported.`)
    }
  }

  const [state, dispatch] = useReducer(uploadReducer, {
    showUploadBtn: false,
    error: null,
    uploading: false
  })

  const { showUploadBtn, error, uploading } = state

  useEffect(() => {
    if (!props.value) {
      showUpload()
    } else {
      hideUpload()
    }
  }, [props.value])

  const showUpload = () => {
    dispatch({ type: 'changeShowUploadBtn', data: { showUploadBtn: true } })
  }

  const hideUpload = () => {
    dispatch({ type: 'changeShowUploadBtn', data: { showUploadBtn: false } })
  }

  const startUpload = async event => {
    const data = new FormData()
    data.append('file', event.target.files[0])

    dispatch({ type: 'uploadStart' })
    await axios
      .post(`${window.BOT_API_PATH}/media`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(response => {
        const { url } = response.data

        dispatch({ type: 'uploadSuccess', data: { url } })
      })
      .catch(e => {
        dispatch({ type: 'uploadError', data: { error: e.message } })
      })
  }

  const { $filter: filter, $subtype: subtype, type } = props.schema
  if (type !== 'string' || subtype !== 'media') {
    return null
  }

  const { value } = props

  return (
    <AccessControl
      operation="write"
      resource="bot.media"
      fallback={<em>You don&apos;t have permission to upload files for this bot. Talk to your team owner.</em>}
    >
      <div className={style.fieldWrapper}>
        {!showUploadBtn && (
          <div style={{ backgroundImage: `url('${value}')` }} className={style.imgWrapper}>
            <div className={style.imgWrapperActions}>
              <Tooltip content="Delete" position={Position.TOP}>
                <Button minimal small intent={Intent.DANGER} icon="trash" onClick={showUpload}></Button>
              </Tooltip>
            </div>
          </div>
        )}
        {showUploadBtn && (
          <Fragment>
            <FileInput
              text="Upload Image"
              large
              inputProps={{
                id: 'node-image',
                name: 'nodeImage',
                accept: 'image/*',
                onChange: startUpload
              }}
            />
            {value && (
              <Button className={style.alignBtnRight} minimal small onClick={hideUpload}>
                Cancel
              </Button>
            )}
            {error && <p className={style.fieldError}>{error}</p>}
          </Fragment>
        )}
      </div>
    </AccessControl>
  )
}

export default UploadWidget
