import { Button, Tooltip } from '@blueprintjs/core'
import React from 'react'

import Icons from '../../../../../../../src/bp/ui-shared-lite/Icons'
import Tabs from '../../../../../../../src/bp/ui-shared-lite/Tabs'

import style from './style.scss'

export default ({ newSession, toggleSettings, maximized, setMaximized }) => {
  const tabs = [
    {
      id: 'content',
      title: 'Debugger'
    }
  ]

  return (
    <div className={style.header}>
      <Tabs currentTab="content" tabs={tabs} />
      <div>
        <Tooltip content="Create a new session">
          <Button minimal={true} icon="refresh" onClick={newSession} />
        </Tooltip>
        <Tooltip content="Configure settings">
          <Button minimal={true} icon="cog" onClick={toggleSettings} />
        </Tooltip>
        <Tooltip content={maximized ? 'Minimize Inspector' : 'Maximize Inspector'}>
          <Button minimal icon={maximized ? <Icons.Minimize /> : 'fullscreen'} onClick={setMaximized} />
        </Tooltip>
      </div>
    </div>
  )
}
