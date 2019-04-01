import React from 'react'
import { Text } from './Text'

export const FileMessage = props => {
  if (!props.file) {
    return null
  }

  const { url, mime, name, storage, text } = props.file

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
