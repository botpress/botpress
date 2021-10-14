import mimeTypes from 'mime/lite'
import React from 'react'
import { MessageTypeHandlerProps } from '../typings'

import { Text } from './Text'

export const File = ({ payload, config }: MessageTypeHandlerProps<'file' | 'video' | 'audio'>) => {
  if (!payload.file) {
    return null
  }

  const { url, title, storage, text } = payload.file

  let extension = ''
  try {
    const validUrl = new URL(url)

    extension = validUrl.pathname
  } catch (error) {
    return null
  }

  const mime = mimeTypes.getType(extension)

  if (text) {
    return <Text payload={{ text, markdown: false }} config={config} />
  }

  if (storage === 'local') {
    return (
      <div className={'bpw-file-message'}>
        <div>{title} (local)</div>
      </div>
    )
  }

  if (mime?.includes('image/')) {
    return (
      <a href={url} target={'_blank'}>
        <img src={url} title={title} />
      </a>
    )
  } else if (mime?.includes('audio/')) {
    return (
      <audio controls>
        <source src={url} type={mime} />
      </audio>
    )
  } else if (mime?.includes('video/')) {
    return (
      <video controls>
        <source src={url} type={mime} />
      </video>
    )
  }

  return (
    <div>
      <span>File: </span>
      <a href={url} target={'_blank'}>
        {title || url}
      </a>
    </div>
  )
}
