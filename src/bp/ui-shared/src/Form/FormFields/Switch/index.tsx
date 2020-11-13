import { Switch as BlueprintSwitch } from '@blueprintjs/core'
import React, { FC } from 'react'

import style from './style.scss'

const Switch: FC<any> = ({ fieldKey, label, className, checked, onChange, children }) => {
  return (
    <div key={fieldKey} className={style.switch}>
      <BlueprintSwitch checked={checked} key={fieldKey} label={label} onChange={onChange} />
      {children}
    </div>
  )
}

export default Switch
