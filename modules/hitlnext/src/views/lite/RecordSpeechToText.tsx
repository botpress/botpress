import { Button } from '@blueprintjs/core'
import { get } from 'lodash'
import React, { FC, useState, useEffect } from 'react'
import { FaMicrophone } from 'react-icons/fa'

interface Props {
  onText: (text: string) => void
  onStart: Function
  onDone?: Function
  onNotAvailable?: Function
  onReady?: Function
}
export const RecordSpeechToText: FC<Props> = props => {
  let recognition: SpeechRecognition
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
      recognition.stop()
      setIsListening(false)
      setText('')
      props.onDone?.(transcript)
    }
  }

  useEffect(() => {
    return () => recognition.removeEventListener('result', onResult)
  }, [])

  const startListening = () => {
    setIsListening(true)
    recognition.start()
  }

  // @ts-ignore
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

  return <Button icon={<FaMicrophone />} disabled={isListening} onClick={startListening} />
}
