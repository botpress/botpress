import React, { FC, useEffect, useRef, useState } from 'react'

import asSuperInput from '../../../FormFields/asSuperInput'
import style from '../style.scss'
import { FieldProps } from '../typings'

interface TextProps extends FieldProps {
  type: string
}

const Text: FC<TextProps> = ({ onBlur, onChange, placeholder, type, value, childRef }) => {
  const [localValue, setLocalValue] = useState(value || '')

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  return (
    <input
      ref={ref => childRef?.(ref)}
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

export default asSuperInput(Text)
