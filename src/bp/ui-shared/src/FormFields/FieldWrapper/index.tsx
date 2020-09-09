import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'
import { FieldWrapperProps } from './typings'

const FieldWrapper: FC<FieldWrapperProps> = ({ label, children, invalid }) => (
  <div className={style.fieldWrapper}>
    {label && <div className={cx(style.label, { [style.labelError]: !!invalid })}>{label}</div>}
    {children}
    {invalid && <div className={style.errorMessage}>{invalid.message}</div>}
  </div>
)

export default FieldWrapper
