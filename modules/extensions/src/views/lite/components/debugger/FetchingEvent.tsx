import { Spinner } from '@blueprintjs/core'
import classnames from 'classnames'
import React from 'react'

import style from './style.scss'

export default () => (
  <div className={classnames(style.splash)}>
    <div>
      <Spinner />
      <h2>Fetching event...</h2>
    </div>
  </div>
)
