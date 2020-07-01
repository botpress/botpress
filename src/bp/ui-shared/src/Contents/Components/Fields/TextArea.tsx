import React, { FC, useEffect, useState } from 'react'

import Textarea from '../../../Textarea'
import style from '../style.scss'
import { FieldProps } from '../typings'

const TextArea: FC<FieldProps> = ({ onBlur, onChange, placeholder, value }) => {
  const [localValue, setLocalValue] = useState(value || '')

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const onKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      e.target.select()
    }
  }

  return (
    <Textarea
      className={style.textarea}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onChange={value => {
        onChange?.(value)
        setLocalValue(value)
      }}
      onBlur={() => onBlur?.(localValue)}
      value={localValue}
    />
  )
}

export default TextArea
