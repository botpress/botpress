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
      <h2>Event not found</h2>
      <p>The requested event was not found. Possible reasons:</p>
      <ul>
        <li>The Event Collector is not enabled in Botpress Config</li>
        <li>The event was pruned from the database </li>
      </ul>
    </div>
  </div>
)
