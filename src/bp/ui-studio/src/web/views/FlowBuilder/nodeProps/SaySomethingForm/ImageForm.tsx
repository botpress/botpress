import { Button, FileInput, Intent, Position, Tooltip } from '@blueprintjs/core'
import axios from 'axios'
import React, { FC, Fragment } from 'react'

import EditableInput from '../../common/EditableInput'
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
      /*this.setState({
        error: `${targetProp} requires an image file`
      })*/
      return
    }

    const data = new FormData()
    data.append('file', event.target.files[0])

    /*if (this.state.error) {
      this.setState({ error: null })
    }*/

    try {
      const res = await axios.post(`bots/${window.BOT_ID}/media`, data, {
        ...axiosConfig,
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      dispatchForm({ type: 'updateData', data: { field: 'image', value: res.data.url } })
    } catch (err) {
      // this.setState({ error: err })
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
          onChange={e => {
            console.log(title)
            console.log(e.target.value)
            dispatchForm({ type: 'updateData', data: { field: 'title', value: e.target.value } })
          }}
        />
      </label>
    </Fragment>
  )
}

export default SaySomethingFormImage
