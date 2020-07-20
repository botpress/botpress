import React from 'react'
import { MdBugReport } from 'react-icons/md'

import style from './style.scss'

export default () => (
  <div className={style.splash}>
    <div>
      <MdBugReport />
      <p>Engage conversation with your chatbot and click on any message to inspect its behaviors.</p>
    </div>
  </div>
)
