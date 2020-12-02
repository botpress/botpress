import { Spinner } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import React from 'react'

import style from '../style.scss'

export default () => (
  <div className={classnames(style.splash)}>
    <div>
      <Spinner />
      <h2>{lang.tr('bottomPanel.debugger.fetchingEvent')}</h2>
    </div>
  </div>
)
