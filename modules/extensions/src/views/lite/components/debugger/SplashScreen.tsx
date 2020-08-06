import React from 'react'

import style from './style.scss'
import DebuggerIcon from './DebuggerIcon'

export default () => (
  <div className={style.splash}>
    <div>
      <span className={style.debuggerIcon}>
        <DebuggerIcon />
      </span>
      <p>Engage conversation with your chatbot and click on any message to inspect its behaviors.</p>
    </div>
  </div>
)
