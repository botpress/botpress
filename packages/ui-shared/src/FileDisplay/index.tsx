import { Button, Intent, Position, Tooltip } from '@blueprintjs/core'
import mime from 'mime-types'
import React, { FC } from 'react'
import { lang } from '../translations'
import style from './style.scss'
import { FileDisplayProps } from './typings'

const FileDisplay: FC<FileDisplayProps> = props => {
  const { url, type, deletable, onDelete } = props

  const filename = url.substring(url.lastIndexOf('/') + 1)
  const mimeType = mime.lookup(url) || undefined

  const deletableFile = () => (
    <Tooltip content={lang('delete')} position={Position.TOP}>
      <Button className={style.deleteFile} minimal small intent={Intent.DANGER} icon="trash" onClick={onDelete} />
    </Tooltip>
  )

  switch (type) {
    case 'image':
      return (
        <div style={{ backgroundImage: `url('${url}')` }} className={style.imageWrapper}>
          <div className={style.imageWrapperActions}>{deletable && deletableFile()}</div>
        </div>
      )
    case 'audio':
      return (
        <div className={style.audioWrapper}>
          <div className={style.audioWrapperActions}>{deletable && deletableFile()}</div>
          <audio controls className={style.audioWrapperSource}>
            <source src={url} type={mimeType} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )
    case 'video':
      return (
        <div className={style.videoWrapper}>
          <div className={style.videoWrapperActions}>{deletable && deletableFile()}</div>
          <video controls width={200} height={200} className={style.videoWrapperSource}>
            <source src={url} type={mimeType} />
            Your browser does not support the video element.
          </video>
        </div>
      )
    case 'file':
      return (
        <div className={style.fileWrapper}>
          <div className={style.fileWrapperActions}>{deletable && deletableFile()}</div>
          <a href={url} target="_blank" className={style.fileWrapperFile}>
            {filename}
          </a>
        </div>
      )
    default:
      return null
  }
}

export default FileDisplay
