import { Button } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'
import { FaMicrophone } from 'react-icons/fa'

import lang from '../lang'

import style from './style.scss'

// store here is the whole webchat store
// reference here: modules/channel-web/src/views/lite/store/index.ts
interface ComposerProps {
  name: string
  store: {
    bp: any
    composer: any
    sendMessage: () => Promise<void>
  }
}

const VoiceComposer: FC<ComposerProps> = props => {
  let recognition: SpeechRecognition
  const [isLoading, setIsLoading] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [text, setText] = useState<string>('')
  const ref = useRef<HTMLTextAreaElement>()

  const onResult = (ev: SpeechRecognitionEvent) => {
    const res = ev.results[0] // cumulated result
    if (res[0].transcript.length > text.length) {
      setText(res[0].transcript) // most confident
    }
    if (res.isFinal) {
      recognition.stop()
      setIsListening(false)
    }
  }

  useEffect(() => {
    setIsLoading(false)
    return () => recognition.removeEventListener('result', onResult)
  }, [])

  const sendMessage = async (): Promise<void> => {
    props.store.composer.updateMessage(text.trim())
    await props.store.sendMessage()
    setText('')
  }

  const startListening = () => {
    setIsListening(true)
    recognition.start()
  }

  const onStart = e => {
    ref.current?.focus()
  }

  const onChange = e => {
    const value = e.target.value
    if (text !== value) {
      setText(value)
    }
  }

  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    console.log('not available fuck this')
    return
  }
  recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = true
  recognition.addEventListener('result', onResult)
  recognition.addEventListener('start', onStart)

  if (isLoading) {
    return <div>loading</div>
  }

  return (
    <div id="voiceComposer" className={cx(style.composerContainer)}>
      <div className={cx(style.composer, 'bpw-composer')}>
        <textarea ref={el => (ref.current = el)} placeholder="Type something" onChange={onChange} value={text} />
      </div>
      <Button icon={<FaMicrophone />} disabled={isLoading || isListening} onClick={startListening} />
      <Button className={style.sendButton} disabled={isLoading || isListening} onClick={sendMessage}>
        {lang.tr('module.hitlnext.conversation.send')}
      </Button>
    </div>
  )
}

export default VoiceComposer
