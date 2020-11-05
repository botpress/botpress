import { Switch } from '@blueprintjs/core'
import React, { FC } from 'react'

import style from './style.scss'

const SharedSwitch: FC<any> = ({ fieldKey, label, className, checked, onChange, children }) => {
  return (
    <div key={fieldKey} className={style.switch}>
      <Switch checked={checked} key={fieldKey} label={label} onChange={onChange} />
      {children}
    </div>
  )
}

export default SharedSwitch
