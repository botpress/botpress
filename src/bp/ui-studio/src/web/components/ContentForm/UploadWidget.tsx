import { Button, FileInput, Intent, Position, Tooltip } from '@blueprintjs/core'
import axios from 'axios'
import { lang } from 'botpress/shared'
import React, { FC, Fragment, useReducer } from 'react'
import { AccessControl } from '~/components/Shared/Utils'
import SmartInput from '~/components/SmartInput'
import style from '~/views/FlowBuilder/sidePanelTopics/form/style.scss'

const UploadWidget: FC<any> = props => {
  const uploadReducer = (state, action) => {
    if (action.type === 'uploadStart') {
      return {
        ...state,
        error: null,
        uploading: true
      }
    } else if (action.type === 'deleteFile') {
      props.onChange(null)
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

      props.onChange(url)
      return {
        ...state,
        error: null,
        uploading: false
      }
    } else if (action.type === 'enterUrlManually') {
      const { enterUrlManually } = action.data
      return {
        ...state,
        error: null,
        enterUrlManually
      }
    } else if (action.type === 'updateUrl') {
      const { url } = action.data

      return {
        ...state,
        error: null,
        url
      }
    } else if (action.type === 'saveUrl') {
      const { url } = action.data

      props.onChange(url)
      return {
        ...state,
        error: null
      }
    } else if (action.type === 'invalidUrl') {
      const { error } = action.data

      return {
        ...state,
        error
      }
    } else {
      throw new Error("That action type isn't supported.")
    }
  }

  const [state, dispatch] = useReducer(uploadReducer, {
    error: null,
    uploading: false,
    enterUrlManually: false,
    url: undefined
  })

  const { error, enterUrlManually, url } = state

  const deleteFile = () => {
    dispatch({ type: 'deleteFile' })
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

  const handleToggleManually = () => {
    dispatch({ type: 'enterUrlManually', data: { enterUrlManually: !enterUrlManually } })
  }

  const handleUrlChange = (value: string) => {
    dispatch({ type: 'updateUrl', data: { url: value } })
  }

  const saveUrl = () => {
    try {
      new URL(url)

      dispatch({ type: 'saveUrl', data: { url } })
    } catch {
      dispatch({ type: 'invalidUrl', data: { error: 'Invalid URL' } })
    }
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
      fallback={<em>{lang.tr('module.builtin.types.image.permissionDenied')}</em>}
    >
      <div className={style.fieldWrapper}>
        {value && (
          <div style={{ backgroundImage: `url('${value}')` }} className={style.imgWrapper}>
            <div className={style.imgWrapperActions}>
              <Tooltip content={lang.tr('delete')} position={Position.TOP}>
                <Button minimal small intent={Intent.DANGER} icon="trash" onClick={deleteFile}></Button>
              </Tooltip>
            </div>
          </div>
        )}

        {!value && (
          <Fragment>
            {!enterUrlManually &&
              <FileInput
                text={lang.tr('module.builtin.types.image.uploadImage')}
                large
                inputProps={{
                  id: 'node-image',
                  name: 'nodeImage',
                  accept: 'image/*',
                  onChange: startUpload
                }}
              />
            }

            {enterUrlManually &&
              <div style={{ display: 'flex' }}>
                <div style={{ flex: 'auto' }}>
                  <SmartInput
                    singleLine
                    className={style.textarea}
                    value={url}
                    onChange={handleUrlChange}
                  />
                </div>
                <Button style={{ flex: 'initial' }} intent={Intent.NONE} onClick={saveUrl} >
                  {lang.tr('ok')}
                </Button>
              </div>
            }

            <a
              style={{textAlign: 'right', paddingTop: '10px', display: 'inline-block', width: '100%'}}
              onClick={handleToggleManually}
            >
              {!enterUrlManually ? lang.tr('module.builtin.types.image.enterUrlChoice') : lang.tr('module.builtin.types.image.uploadFileChoice')}
            </a>

            {error && <p className={style.fieldError}>{error}</p>}
          </Fragment>
        )}
      </div>
    </AccessControl>
  )
}

export default UploadWidget
