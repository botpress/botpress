import cx from 'classnames'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import sharedStyle from '../../../ui-shared-lite/style.scss'
import { lang } from '../translations'

import style from './style.scss'
import { TextareaProps } from './typings'

const Textarea: FC<TextareaProps> = ({
  refValue,
  forceUpdateHeight,
  isFocused,
  onChange,
  className,
  value,
  placeholder,
  onPaste,
  onBlur,
  onKeyDown
}) => {
  const [forceUpdate, setForceUpdate] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const height = useRef(33)
  const initialChange = useRef(true)

  useEffect(() => {
    height.current = inputRef.current?.scrollHeight || 33
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
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
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
        onPaste={onPaste}
        style={{ height: `${height.current}px` }}
        ref={inputRef}
        className={cx(style.textarea, className)}
        value={value || refValue}
        placeholder={placeholder}
        onChange={e => handleOnChange(e.currentTarget.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onInput={updateHeight}
      />
      {missingTranslation && <span className={sharedStyle.fieldError}>{lang('pleaseTranslateField')}</span>}
    </Fragment>
  )
}

export default Textarea
