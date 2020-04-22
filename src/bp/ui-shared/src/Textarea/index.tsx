import cx from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'

import style from './style.scss'
import { TextareaProps } from './typings'

const Textarea: FC<TextareaProps> = props => {
  const [forceUpdate, setForceUpdate] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '0'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
    }
  }, [])

  const onInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = '0'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
      setForceUpdate(!forceUpdate)
    }
  }

  return (
    <textarea
      ref={inputRef}
      className={cx(style.textarea, props.className)}
      value={props.value}
      onChange={props.onChange}
      onKeyDown={props.onKeyDown}
      onInput={onInput}
    />
  )
}

export default Textarea
