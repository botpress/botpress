import React from 'react'

import lang from '../../../lang'

import DebuggerIcon from './components/DebuggerIcon'
import style from './style.scss'
export default () => (
  <div className={style.splash}>
    <div>
      <span className={style.debuggerIcon}>
        <DebuggerIcon />
      </span>
      <p>{lang.tr('module.extensions.splashMessage')}</p>
    </div>
  </div>
)
