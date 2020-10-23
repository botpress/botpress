import cx from 'classnames'
import React, { FC } from 'react'

import sharedStyle from '../../../../../ui-shared-lite/style.scss'
import { FieldWrapperProps } from '../typings'

import style from './style.scss'

const FieldWrapper: FC<FieldWrapperProps> = ({ label, children, invalid }) => (
  <div className={sharedStyle.fieldWrapper}>
    {label && <div className={cx(style.label, { [style.labelError]: !!invalid })}>{label}</div>}
    {children}
    {invalid && <div className={style.errorMessage}>{invalid.message}</div>}
  </div>
)

export default FieldWrapper
