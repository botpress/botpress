// @ts-nocheck
import cx from 'classnames'
import { get } from 'lodash'
import React, { FC, useState, useEffect } from 'react'
import Microphone from '../Icons/Microphone'

interface Props {
  onText: (text: string) => void
  onStart?: Function
  onDone?: Function
  onNotAvailable?: Function
  onReady?: Function
  className?: string
}
export const RecordSpeechToText: FC<Props> = props => {
  // For some reason, it doesn't detect the re-assignment below.
  // eslint-disable-next-line prefer-const
  let recognition
  const [isListening, setIsListening] = useState(false)
  const [text, setText] = useState<string>('')
  const [isAvailable, setIsAvailable] = useState(true)

  if (!isAvailable) {
    return null
  }

  const onResult = (ev: SpeechRecognitionEvent) => {
    const res = ev.results[0] // cumulated result
    const transcript = get(res, '0.transcript') // most confident

    if (transcript.length > text.length) {
      setText(transcript)
      props.onText(transcript)
    }

    if (res.isFinal) {
      recognition?.stop()
      setIsListening(false)
      setText('')
      props.onDone?.(transcript)
    }
  }

  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.removeEventListener('result', onResult)
        recognition.removeEventListener('start', props.onStart)
      }
    }
  }, [])

  const startListening = () => {
    setIsListening(true)
    recognition?.start()
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    setIsAvailable(false)
    props.onNotAvailable?.()
    return null
  }

  recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = true
  recognition.addEventListener('result', onResult)
  recognition.addEventListener('start', () => props.onStart())

  return (
    <button className={cx('bpw-send-button', props.className)} disabled={isListening} onClick={startListening}>
      <Microphone fill={isListening ? '#f1f1f1' : 'black'} />
    </button>
  )
}
