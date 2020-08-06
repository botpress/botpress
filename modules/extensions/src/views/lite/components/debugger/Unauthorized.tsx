import classnames from 'classnames'
import React from 'react'

import style from './style.scss'
import DebuggerIcon from './DebuggerIcon'

export default () => (
  <div className={classnames(style.splash, style.notFound)}>
    <div>
      <span className={style.debuggerIcon}>
        <DebuggerIcon />
      </span>
      <h2>Unauthorized</h2>
      <p>
        You lack sufficient permissions to inspect events. <br />
        Permission required: write access on "module.extensions"
      </p>
    </div>
  </div>
)
