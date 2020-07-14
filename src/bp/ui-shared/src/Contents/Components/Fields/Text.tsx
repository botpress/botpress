import { FormField } from 'botpress/sdk'
import React, { FC, useEffect, useState } from 'react'

import { getFieldDefaultValue } from '../../utils/fields'
import style from '../style.scss'
import { FieldProps } from '../typings'

type TextProps = FieldProps & { field: FormField }

const Text: FC<TextProps> = ({ onBlur, onChange, placeholder, field, value }) => {
  const { valueManipulation, type, min, max, maxLength } = field
  const [localValue, setLocalValue] = useState(value || getFieldDefaultValue(field))

  useEffect(() => {
    setLocalValue(value ?? getFieldDefaultValue(field))
  }, [value])

  const onKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      e.target.select()
    }
  }

  const reformatValue = value => {
    if (valueManipulation) {
      const { regex, modifier, replaceChar } = valueManipulation
      const re = new RegExp(regex, modifier)

      value = value.replace(re, replaceChar)
    }

    if (max !== undefined && Number(value) > max) {
      value = `${max}`
    }

    if (min !== undefined && Number(value) < min) {
      value = `${min}`
    }

    return value
  }

  return (
    <input
      className={style.input}
      type={type}
      maxLength={maxLength}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onChange={e => {
        const value = reformatValue(e.target.value)

        onChange?.(value)
        setLocalValue(value)
      }}
      onBlur={() => onBlur?.(localValue)}
      value={localValue}
    />
  )
}

export default Text
