import React from 'react'
import path from 'path'
import mimeTypes from 'mime-types'
import { Text } from './Text'

export const FileMessage = props => {
  if (!props.file) {
    return null
  }

  const { url, name, storage, text } = props.file

  const extension = path.extname(url)
  const mime = mimeTypes.lookup(extension)
  const basename = path.basename(url, extension)

  if (text) {
    return <Text text={text} />
  }

  if (storage === 'local') {
    return (
      <div className={'bpw-file-message'}>
        <div>{name} (local)</div>
      </div>
    )
  }

  if (!mime) {
    return (
      <div className={'bpw-file-message'}>
        <a href={url} target="_blank">
          {name}
        </a>
      </div>
    )
  }

  if (mime.includes('image/')) {
    return (
      <a href={url} target="_blank">
        <img src={url} title={name} />
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
      <video width="240" controls>
        <source src={url} type={mime} />
      </video>
    )
  }
}
