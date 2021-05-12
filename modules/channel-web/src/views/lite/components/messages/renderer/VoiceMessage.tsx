import mimeTypes from 'mime/lite'
import path from 'path'
import React, { FC } from 'react'

import { Renderer } from '../../../typings'

type Props = Renderer.VoiceMessage & { autoPlay: boolean }

export const VoiceMessage: FC<Props> = (props: Props) => {
  if (!props.file) {
    return null
  }

  const { audio } = props.file

  const extension = path.extname(audio)
  const mime = mimeTypes.getType(extension)

  return (
    <audio controls autoPlay={props.autoPlay}>
      <source src={audio} type={mime} />
    </audio>
  )
}
