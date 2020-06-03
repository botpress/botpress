import React, { FC } from 'react'

import Textarea from '../../../Textarea'
import style from '../style.scss'
import { FieldProps } from '../typings'

const TextArea: FC<FieldProps> = ({ onBlur, onChange, placeholder, value }) => (
  <Textarea
    className={style.textarea}
    placeholder={placeholder}
    rows={1}
    onChange={value => onChange?.(value)}
    onBlur={onBlur}
    value={value}
  />
)

export default TextArea
