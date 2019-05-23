import { Button } from '@blueprintjs/core'
import React from 'react'

import style from './style.scss'

export default ({ newSession, toggleSettings }) => (
  <div className={style.header}>
    <h4>Debugger</h4>
    <div>
      <Button minimal={true} icon="refresh" onClick={newSession} title="New Session" />
      <Button minimal={true} icon="cog" onClick={toggleSettings} title="Settings" />
    </div>
  </div>
)
