import { Button } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, useEffect, useState } from 'react'
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

  const onResult = (ev: SpeechRecognitionEvent) => {
    const res = ev.results[0] // cumulated result
    setText(res[0].transcript) // most confident
    if (res.isFinal) {
      recognition.stop()
      setIsListening(false)
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

  const onChange = e => {
    const value = e.target.value
    if (text !== value) {
      setText(value)
    }
  }

  if (isLoading) {
    return <div>loading</div>
  }

  return (
    <div id="shortcutContainer" className={cx(style.composerContainer)}>
      <div className={cx(style.composer, 'bpw-composer')}>
        <textarea
          // ref={this.textInput}
          // id="input-message"
          // onFocus={this.props.setFocus.bind(this, 'input')}
          // placeholder={placeholder}
          onChange={onChange}
          value={text}
          // onKeyPress={this.handleKeyPress}
          // onKeyDown={this.handleKeyDown}
          // aria-label={this.props.intl.formatMessage({
          //   id: 'composer.message',
          //   defaultMessage: 'Message to send'
          // })}
        />
      </div>
      <Button icon={<FaMicrophone />} disabled={isLoading || isListening} onClick={startListening} />
      <Button className={style.sendButton} disabled={isLoading || isListening} onClick={sendMessage}>
        {lang.tr('module.hitlnext.conversation.send')}
      </Button>
    </div>
  )
}

export default VoiceComposer
