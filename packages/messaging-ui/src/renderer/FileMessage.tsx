import mimeTypes from 'mime/lite'
import React from 'react'

import { Renderer } from '../typings'

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
    // If the URL is not valid return a dummy component.
    return null
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
