import React, { FC } from 'react'

import style from './style.scss'
import { FieldWrapperProps } from './typings'

const FieldWrapper: FC<FieldWrapperProps> = ({ label, children }) => (
  <div className={style.fieldWrapper}>
    {label && <span className={style.label}>{label}</span>}
    {children}
  </div>
)

export default FieldWrapper
