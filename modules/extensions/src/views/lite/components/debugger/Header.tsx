import { Button, Tooltip } from '@blueprintjs/core'
import React from 'react'

import style from './style.scss'

export default ({ newSession, toggleSettings }) => (
  <div className={style.header}>
    <h4>Debugger</h4>
    <div>
      <Tooltip content="Create a new session">
        <Button minimal={true} icon="refresh" onClick={newSession} />
      </Tooltip>
      <Tooltip content="Configure settings">
        <Button minimal={true} icon="cog" onClick={toggleSettings} />
      </Tooltip>
    </div>
  </div>
)
