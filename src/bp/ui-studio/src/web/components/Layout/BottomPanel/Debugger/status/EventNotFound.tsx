import { lang } from 'botpress/shared'
import classnames from 'classnames'
import React from 'react'

import DebuggerIcon from '../components/DebuggerIcon'
import style from '../style.scss'

export default () => (
  <div className={classnames(style.splash, style.notFound)}>
    <div>
      <DebuggerIcon />
      <h2>{lang.tr('bottomPanel.debugger.eventNotFound.title')}</h2>
      <p>{lang.tr('bottomPanel.debugger.eventNotFound.message')}</p>
      <ul>
        <li>{lang.tr('bottomPanel.debugger.eventNotFound.message2')}</li>
        <li>{lang.tr('bottomPanel.debugger.eventNotFound.message3')}</li>
      </ul>
    </div>
  </div>
)
