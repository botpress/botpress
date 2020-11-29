import { lang } from 'botpress/shared'
import React from 'react'

import DebuggerIcon from '../components/DebuggerIcon'
import style from '../style.scss'

export default () => (
  <div className={style.splash}>
    <div>
      <span className={style.debuggerIcon}>
        <DebuggerIcon />
      </span>
      <p>{lang.tr('bottomPanel.debugger.splashMessage')}</p>
    </div>
  </div>
)
