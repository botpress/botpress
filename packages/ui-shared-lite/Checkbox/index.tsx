// @ts-nocheck
import { Checkbox } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'
import { CheckboxProps } from './typings'

const SharedCheckbox: FC<CheckboxProps> = ({ fieldKey, label, className, checked, onChange, children }) => {
  return (
    <div key={fieldKey} className={cx(style.checkboxWrapper, className, 'checkbox-wrapper')}>
      <Checkbox checked={checked} key={fieldKey} label={label} onChange={onChange} />
      {children}
    </div>
  )
}

export default SharedCheckbox
