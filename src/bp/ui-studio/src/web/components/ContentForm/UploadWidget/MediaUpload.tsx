import { FileInput } from '@blueprintjs/core'
import axios from 'axios'
import { lang } from 'botpress/shared'
import React, { FC, FormEvent } from 'react'
import style from '~/views/FlowBuilder/sidePanelTopics/form/style.scss'

import { isBpUrl } from '../../../../../../common/url'

import DeletableImage from './DeletableImage'

interface IMediaUploadProps {
  value: string | null
  onChange(value: string | null): void
  onDelete(): void
  onError(value: string | Error): void
}

const MediaUpload: FC<IMediaUploadProps> = props => {
  const { value } = props

  const startUpload = async (event: FormEvent<HTMLInputElement>) => {
    const data = new FormData()
    data.append('file', event.currentTarget.files[0])

    return axios
      .post(`${window.BOT_API_PATH}/media`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(response => {
        const { url } = response.data

        props.onChange(url)
      })
      .catch(e => {
        props.onError(e.message)
      })
  }

  return (
    <div className={style.fieldWrapper}>
      {value && isBpUrl(value) && (
        <DeletableImage value={value} onDelete={props.onDelete} />
      )}

      {!value && (
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
      )}
    </div>
  )
}

export default MediaUpload
