import mimeTypes from 'mime/lite'
import path from 'path'
import React, { FC, useRef, useEffect } from 'react'

export const VoiceMessage: FC<any> = (props: any) => {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    audioRef.current?.addEventListener('ended', props.onAudioEnded)

    return () => audioRef.current?.removeEventListener('ended', props.onAudioEnded)
  }, [])

  useEffect(() => {
    // Simulate an autoplay by playing every voice messages of a single message group one after the other
    if (props.file.autoPlay && props.shouldPlay) {
      // TODO: handle this appropriately
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      audioRef.current?.play()
    }
  }, [props.file.autoPlay, props.shouldPlay])

  if (!props.file) {
    return null
  }

  const { audio } = props.file

  const extension = path.extname(audio)
  const mime = mimeTypes.getType(extension)

  return (
    <audio controls ref={audioRef}>
      <source src={audio} type={mime || 'audio/mp3'} />
    </audio>
  )
}
