import cx from 'classnames'
import mime from 'mime/lite'
import React, { FC, useCallback, useState, useEffect, useRef, Fragment } from 'react'

import Cancel from '../../../../../../packages/ui-shared-lite/Icons/Cancel'
import Microphone from '../../../../../../packages/ui-shared-lite/Icons/Microphone'

interface Props {
  onDone: (voice: Buffer, ext: string) => Promise<void>
  onStart?: () => void
  onNotAvailable?: () => void
  className?: string
}

const VoiceRecorder: FC<Props> = (props: Props) => {
  const [isRecording, setIsRecording] = useState(false)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const mediaChunks = useRef<Blob[]>([])
  const mediaStream = useRef<MediaStream | null>(null)
  const isCancelled = useRef<boolean>(false)

  const getMediaStream = useCallback(async () => {
    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      mediaStream.current = stream
    } catch (err) {
      console.error('[VoiceRecorder] - Error while creating MediaStream', err)

      props.onNotAvailable?.()
    }
  }, [])

  useEffect(() => {
    return () => {
      mediaRecorder.current?.removeEventListener('dataavailable', onResult)
      props.onStart && mediaRecorder.current?.removeEventListener('start', props.onStart)
      mediaRecorder.current?.removeEventListener('stop', onStop)
      mediaRecorder.current?.removeEventListener('error', onError)
    }
  }, [])

  const onError = (ev: MediaRecorderErrorEvent) => {
    console.error(
      `[VoiceRecorder] - Error while recording audio: ${ev.error.name} (${ev.error.code}) - ${ev.error.message}`
    )

    props.onNotAvailable?.()
  }

  const onResult = (e: BlobEvent) => {
    if (e.data.size > 0) {
      mediaChunks.current.push(e.data)
    }
  }

  const onStop = async () => {
    if (isCancelled.current) {
      isCancelled.current = false
      return
    }

    try {
      if (mediaChunks.current.length) {
        const firstBlob: Blob = mediaChunks.current[0]
        // Fallback to ogg when detecting the extension since it's the most common
        // audio format supported by modern browsers
        const ext = mime.getExtension(firstBlob.type) || 'ogg'

        const blob = new Blob(mediaChunks.current)
        const arrayBuffer = await blob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        await props.onDone(buffer, ext)
      }
    } catch (err) {
      console.error('[VoiceRecorder] - Error converting the audio blob into a buffer', err)
    } finally {
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current?.state !== 'inactive') {
      mediaRecorder.current?.stop()
      mediaStream.current && mediaStream.current.getTracks().forEach(track => track.stop())
      mediaChunks.current = []

      setIsRecording(false)
    }
  }

  const cancelRecording = () => {
    isCancelled.current = true

    stopRecording()
  }

  const startRecording = async () => {
    if (!mediaStream.current || mediaStream.current.getTracks().some(track => track.readyState === 'ended')) {
      await getMediaStream()
    }

    if (mediaStream.current) {
      mediaRecorder.current = new MediaRecorder(mediaStream.current)

      mediaRecorder.current.addEventListener('dataavailable', onResult)
      props.onStart && mediaRecorder.current.addEventListener('start', props.onStart)
      mediaRecorder.current.addEventListener('stop', onStop)
      mediaRecorder.current.addEventListener('error', onError)

      mediaRecorder.current.start()
      setIsRecording(true)
    }
  }

  if (!window.MediaRecorder) {
    props.onNotAvailable?.()
    return null
  }

  return (
    <div className={'bpw-voice-recorder'}>
      <button className={cx('bpw-send-button', props.className)} onClick={isRecording ? stopRecording : startRecording}>
        <Microphone fill={isRecording ? '#f1f1f1' : 'black'} />
      </button>
      {isRecording && (
        <button className={cx('bpw-send-button', props.className)} onClick={cancelRecording}>
          <Cancel fill="#ff0000" />
        </button>
      )}
    </div>
  )
}

export default VoiceRecorder
