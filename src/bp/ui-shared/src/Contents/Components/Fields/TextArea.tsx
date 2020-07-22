import { FormField } from 'botpress/sdk'
import React, { FC, useEffect, useState } from 'react'

import Textarea from '../../../Textarea'
import style from '../style.scss'
import { FieldProps } from '../typings'

type TextAreaProps = FieldProps & { field: FormField }

const TextArea: FC<TextAreaProps> = ({ onBlur, onChange, placeholder, field: { valueManipulation }, value }) => {
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

export default TextArea
