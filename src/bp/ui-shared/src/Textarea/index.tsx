import cx from 'classnames'
import React, { FC, useEffect, useRef, useState, Fragment } from 'react'

import style from './style.scss'
import { TextareaProps } from './typings'
import { lang } from '../translations'

const Textarea: FC<TextareaProps> = ({
  refValue,
  forceUpdateHeight,
  isFocused,
  onChange,
  className,
  value,
  placeholder,
  onBlur,
  onKeyDown
}) => {
  const [forceUpdate, setForceUpdate] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const height = useRef(39)
  const initialChange = useRef(true)

  useEffect(() => {
    height.current = inputRef.current?.scrollHeight || 39
    setForceUpdate(!forceUpdate)
  }, [])

  useEffect(() => {
    if (!initialChange.current) {
      updateHeight()
    }

    initialChange.current = false
  }, [forceUpdateHeight])

  useEffect(() => {
    if (inputRef.current && isFocused) {
      const length = inputRef.current.value?.length

      inputRef.current.focus()
      inputRef.current.setSelectionRange(length, length)
    }
  }, [isFocused])

  const updateHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = '0'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
      setForceUpdate(!forceUpdate)
    }
  }

  const handleOnChange = value => {
    onChange(value)
  }

  const missingTranslation = refValue && !value

  return (
    <Fragment>
      <textarea
        style={{ height: height.current + 'px' }}
        ref={inputRef}
        className={cx(style.textarea, className)}
        value={value || refValue}
        placeholder={placeholder}
        onChange={e => handleOnChange(e.currentTarget.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onInput={updateHeight}
      />
      {missingTranslation && <span className={style.fieldError}>{lang('pleaseTranslateField')}</span>}
    </Fragment>
  )
}

export default Textarea
