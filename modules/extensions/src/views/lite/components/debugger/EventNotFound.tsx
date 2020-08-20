import classnames from 'classnames'
import React from 'react'

import lang from '../../../lang'

import style from './style.scss'
import DebuggerIcon from './DebuggerIcon'

export default () => (
  <div className={classnames(style.splash, style.notFound)}>
    <div>
      <span className={style.debuggerIcon}>
        <DebuggerIcon />
      </span>
      <h2>{lang.tr('module.extensions.eventNotFound.title')}</h2>
      <p>{lang.tr('module.extensions.eventNotFound.message')}</p>
      <ul>
        <li>{lang.tr('module.extensions.eventNotFound.message2')}</li>
        <li>{lang.tr('module.extensions.eventNotFound.message3')}</li>
      </ul>
    </div>
  </div>
)
