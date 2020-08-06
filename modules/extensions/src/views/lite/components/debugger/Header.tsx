import { Tab, Tabs } from '@blueprintjs/core'
import React, { useState } from 'react'

import MoreOptions from '../../../../../../../src/bp/ui-shared-lite/MoreOptions'
import { MoreOptionsItems } from '../../../../../../../src/bp/ui-shared-lite/MoreOptions/typings'

import style from './style.scss'

export default ({ newSession, toggleSettings, hasProcessing, updateCurrentTab, selectedTab }) => {
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
      <Tabs id="contentFormTabs" onChange={updateCurrentTab} defaultSelectedTabId={selectedTab}>
        <Tab id="content" title="Debugger" />
        {hasProcessing && <Tab id="processing" title="Processing" />}
      </Tabs>
      {<MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />}
    </div>
  )
}
