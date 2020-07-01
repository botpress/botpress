import { FormField } from 'botpress/sdk'
import React, { FC, useEffect, useState } from 'react'

import { getFieldDefaultValue } from '../../utils/fields'
import style from '../style.scss'
import { FieldProps } from '../typings'

type TextProps = FieldProps & { field: FormField }

const Text: FC<TextProps> = ({
  onBlur,
  onChange,
  placeholder,
  field: { valueManipulation, type, min, max, maxLength },
  value
}) => {
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
      max={max}
      min={min}
      maxLength={maxLength}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onChange={e => {
        let value = e.target.value

        if (valueManipulation) {
          const { regex, modifier, replaceChar } = valueManipulation
          const re = new RegExp(regex, modifier)

          value = value.replace(re, replaceChar)
        }

        onChange?.(value)
        setLocalValue(value)
      }}
      onBlur={() => onBlur?.(localValue)}
      value={localValue}
    />
  )
}

export default Text
