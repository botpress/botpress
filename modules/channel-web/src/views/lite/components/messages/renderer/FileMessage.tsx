import mimeTypes from 'mime/lite'
import path from 'path'
import React from 'react'

import { Renderer } from '../../../typings'

import { Text } from './Text'

export const FileMessage = (props: Renderer.FileMessage) => {
  if (!props.file) {
    return null
  }

  const { url, title, storage, text } = props.file

  let extension = ''
  try {
    const validUrl = new URL(url)

    extension = validUrl.pathname
  } catch (error) {
    // Try using path.extname since url might be relative.
    extension = path.extname(url)
  }

  const mime = mimeTypes.getType(extension)

  if (text) {
    return <Text text={text} markdown escapeHTML={props.escapeTextHTML} />
  }

  if (storage === 'local') {
    return (
      <div className={'bpw-file-message'}>
        <div>{title} (local)</div>
      </div>
    )
  }

  if (mime.includes('image/')) {
    return (
      <a href={url} target={'_blank'}>
        <img src={url} title={title} />
      </a>
    )
  } else if (mime.includes('audio/')) {
    return (
      <audio controls>
        <source src={url} type={mime} />
      </audio>
    )
  } else if (mime.includes('video/')) {
    return (
      <video controls>
        <source src={url} type={mime} />
      </video>
    )
  } else {
    return (
      <div>
        <span>File: </span>
        <a href={url} target={'_blank'}>
          {title || url}
        </a>
      </div>
    )
  }
}
