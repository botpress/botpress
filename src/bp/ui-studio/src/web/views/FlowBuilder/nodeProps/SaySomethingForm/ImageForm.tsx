import { Button, FileInput, Intent, Position, Tooltip } from '@blueprintjs/core'
import axios from 'axios'
import React, { FC, Fragment, useState } from 'react'

import style from '../style.scss'

import { FormState } from './index'

const axiosConfig = {
  baseURL: 'api/v1/'
}

interface Props {
  formState: FormState
  dispatchForm: any
}

const SaySomethingFormImage: FC<Props> = props => {
  const { formState, dispatchForm } = props
  const { title, image } = formState
  const [imgError, setImgError] = useState(null)

  const handleKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 65) {
      e.target.select()
    }
  }

  const handleImageFileChanged = async event => {
    const targetProp = event.target.name
    if (!event.target.files) {
      return
    }

    if (!event.target.files[0].type.includes('image/')) {
      setImgError(`${targetProp} requires an image file`)
      return
    }

    const data = new FormData()
    data.append('file', event.target.files[0])

    setImgError(null)

    try {
      const res = await axios.post(`bots/${window.BOT_ID}/media`, data, {
        ...axiosConfig,
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      dispatchForm({ type: 'updateData', data: { field: 'image', value: res.data.url } })
    } catch (err) {
      setImgError(err)
    }
  }

  return (
    <Fragment>
      <div className={style.fieldWrapper}>
        <span className={style.formLabel}>Image*</span>
        {image && (
          <div style={{ backgroundImage: `url('${image}')` }} className={style.imgWrapper}>
            <div className={style.imgWrapperActions}>
              <Tooltip content="Delete" position={Position.TOP}>
                <Button
                  minimal
                  small
                  intent={Intent.DANGER}
                  icon="trash"
                  onClick={() => dispatchForm({ type: 'updateData', data: { field: 'image', value: '' } })}
                ></Button>
              </Tooltip>
            </div>
          </div>
        )}
        {!image && (
          <Fragment>
            <FileInput
              text="Upload Image"
              large
              inputProps={{
                id: 'node-image',
                name: 'nodeImage',
                accept: 'image/*',
                onChange: handleImageFileChanged
              }}
            />
            {imgError && <p className={style.fieldError}>{imgError}</p>}
          </Fragment>
        )}
      </div>
      <label className={style.fieldWrapper}>
        <span className={style.formLabel}>Title</span>
        <input
          value={title}
          type="text"
          placeholder="Optional"
          onKeyDown={handleKeyDown}
          className={style.textInput}
          onChange={e => dispatchForm({ type: 'updateData', data: { field: 'title', value: e.target.value } })}
        />
      </label>
    </Fragment>
  )
}

export default SaySomethingFormImage
