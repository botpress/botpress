import { Tab, Tabs } from '@blueprintjs/core'
import React, { useState } from 'react'

import MoreOptions from '../../../../../../../src/bp/ui-shared/src/MoreOptions'
import { MoreOptionsItems } from '../../../../../../../src/bp/ui-shared/src/MoreOptions/typings'

import style from './style.scss'

export default ({ newSession, toggleSettings }) => {
  const [showOptions, setShowOptions] = useState(false)

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: 'Create a new session',
      action: newSession,
      icon: 'refresh'
    },
    {
      label: 'Configure settings',
      action: toggleSettings,
      icon: 'cog'
    }
  ]

  return (
    <div className={style.header}>
      <Tabs id="contentFormTabs">
        <Tab id="content" title="Debugger" />
      </Tabs>
      {<MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />}
    </div>
  )
}
