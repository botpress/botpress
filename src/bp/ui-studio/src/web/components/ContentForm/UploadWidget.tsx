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
        uploading: false,
      }
    } else if (action.type === 'setManually') {
      return {
        ...state,
        ...action.data
      }
    } else if (action.type === 'setURL') {
      const { url } = action.data

      props.onChange(url)
      return {
        ...state,
        url
      }
    } else {
      throw new Error("That action type isn't supported.")
    }
  }

  const [state, dispatch] = useReducer(uploadReducer, {
    error: null,
    uploading: false,
    manually: false,
    url: undefined
  })

  const { error, uploading, manually, url } = state

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
    dispatch({ type: 'setManually', data: { manually: !manually } })
  }

  const handleURLChange = (value: string) => {
    dispatch({ type: 'setURL', data: { url: value } })
  }

  const { $filter: filter, $subtype: subtype, type } = props.schema
  if (type !== 'string' || subtype !== 'media') {
    return null
  }

  const { value } = props

  const properties = { 
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    position: 'absolute',
    right: 0,
    bottom: '2rem',
    padding: '0.5rem',
    fontFamily: 'sans-serif',
    fontSize: '1.5rem',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
  }

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
            <div>
              {!manually && 
                <FileInput
                  text={lang.tr('module.builtin.types.image.uploadImage')}
                  large
                  inputProps={{
                    id: 'node-image',
                    name: 'nodeImage',
                    accept: 'image/*',
                    onChange: startUpload
                  }}
                />}

              {manually && 
                <SmartInput
                  className={style.textarea}
                  singleLine={false}
                  placeholder="https://www.image.com/image.png"
                  value={url}
                  onChange={handleURLChange}
                />}

              <a 
                style={{textAlign: 'right', paddingTop: '10px', display: 'inline-block', width: '100%'}} 
                onClick={handleToggleManually}
              >
                Or {manually ? 'upload an image' : 'enter a URL'}
              </a>

              {error && <p className={style.fieldError}>{error}</p>}
            </div>
          </Fragment>
        )}
      </div>
    </AccessControl>
  )
}

export default UploadWidget
