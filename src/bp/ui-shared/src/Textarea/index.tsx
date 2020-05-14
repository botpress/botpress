import cx from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'

import style from './style.scss'
import { TextareaProps } from './typings'

const Textarea: FC<TextareaProps> = props => {
  const [forceUpdate, setForceUpdate] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const height = useRef(39)

  useEffect(() => {
    height.current = inputRef.current?.scrollHeight || 39
    setForceUpdate(!forceUpdate)
  }, [])

  useEffect(() => {
    if (inputRef.current && props.isFocused) {
      const length = inputRef.current.value?.length

      inputRef.current.focus()
      inputRef.current.setSelectionRange(length, length)
    }
  }, [props.isFocused])

  const onInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = '0'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
      setForceUpdate(!forceUpdate)
    }
  }

  const onChange = value => {
    props.onChange(value)
  }

  return (
    <textarea
      style={{ height: height.current + 'px' }}
      ref={inputRef}
      className={cx(style.textarea, props.className)}
      value={props.value}
      placeholder={props.placeholder}
      onChange={e => onChange(e.currentTarget.value)}
      onBlur={props.onBlur}
      onKeyDown={props.onKeyDown}
      onInput={onInput}
    />
  )
}

export default Textarea
