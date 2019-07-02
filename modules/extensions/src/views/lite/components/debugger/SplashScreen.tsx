import React from 'react'
import { MdBugReport } from 'react-icons/md'

import style from './style.scss'

export default () => (
  <div className={style.splash}>
    <div>
      <MdBugReport />
      <h2>Conversation Debugger</h2>
      <p>
        Inspect the internals of a bot reply and better understand how your bot behaves. To start debugging simply speak
        with your bot and click on any message.
      </p>
    </div>
  </div>
)
