import { FormField, FormFieldType } from 'botpress/sdk'
import React, { FC, useEffect, useState } from 'react'

import { getFieldDefaultValue } from '../../utils/fields'
import style from '../style.scss'
import { FieldProps } from '../typings'

type TextProps = FieldProps & { type: FormFieldType }

const Text: FC<TextProps> = ({ onBlur, onChange, placeholder, type, value }) => {
  const [localValue, setLocalValue] = useState(value || getFieldDefaultValue({ type }))

  useEffect(() => {
    setLocalValue(value || getFieldDefaultValue({ type }))
  }, [value])

  const onKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      e.target.select()
    }
  }

  return (
    <input
      className={style.input}
      type={type}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onChange={e => {
        const value = e.target.value

        onChange?.(value)
        setLocalValue(value)
      }}
      onBlur={() => onBlur?.(localValue)}
      value={localValue}
    />
  )
}

export default Text
