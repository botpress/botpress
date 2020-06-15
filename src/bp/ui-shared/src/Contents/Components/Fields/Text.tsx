import React, { FC, useEffect, useState } from 'react'

import style from '../style.scss'
import { FieldProps } from '../typings'

interface TextProps extends FieldProps {
  type: string
}

const Text: FC<TextProps> = ({ onBlur, onChange, placeholder, type, value }) => {
  const [localValue, setLocalValue] = useState(value || '')

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  return (
    <input
      className={style.input}
      type={type}
      placeholder={placeholder}
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
