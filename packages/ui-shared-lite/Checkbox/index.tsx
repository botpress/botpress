import { Checkbox } from '@blueprintjs/core'
import cx from 'classnames'
import React from 'react'

import style from './style.scss'
import { CheckboxProps } from './typings'

const SharedCheckbox = ({ fieldKey, label, className, checked, onChange, children, ...props }: CheckboxProps) => {
  return (
    <div key={fieldKey} className={cx(style.checkboxWrapper, className, 'checkbox-wrapper')}>
      <Checkbox checked={checked} key={fieldKey} label={label as string} onChange={onChange} {...props} />
      {children}
    </div>
  )
}

export default SharedCheckbox
