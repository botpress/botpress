import classnames from 'classnames'
import React from 'react'
import { MdBugReport } from 'react-icons/md'

import style from './style.scss'

export default () => (
  <div className={classnames(style.splash, style.notFound)}>
    <div>
      <MdBugReport />
      <h2>Event not found</h2>
      <p>
        The requested event was not found. Possible reasons:
        <ul>
          <li>The Event Collector is not enabled in Botpress Config</li>
          <li>The event was pruned from the database </li>
        </ul>
      </p>
    </div>
  </div>
)
