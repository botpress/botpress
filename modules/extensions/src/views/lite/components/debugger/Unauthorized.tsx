import classnames from 'classnames'
import React from 'react'
import { MdBugReport } from 'react-icons/md'

import style from './style.scss'

export default () => (
  <div className={classnames(style.splash, style.notFound)}>
    <div>
      <MdBugReport />
      <h2>Unauthorized</h2>
      <p>
        You lack sufficient permissions to inspect events. <br />Permission required: write access on
        "module.extensions"
      </p>
    </div>
  </div>
)
