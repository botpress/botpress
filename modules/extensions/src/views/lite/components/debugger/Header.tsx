import { Tab, Tabs } from '@blueprintjs/core'
import React, { useState } from 'react'

import MoreOptions from '../../../../../../../src/bp/ui-shared-lite/MoreOptions'
import { MoreOptionsItems } from '../../../../../../../src/bp/ui-shared-lite/MoreOptions/typings'
import lang from '../../../lang'

import style from './style.scss'

export default ({ newSession, toggleSettings, hasProcessing, updateCurrentTab, selectedTab }) => {
  const [showOptions, setShowOptions] = useState(false)

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('module.extensions.header.newSession'),
      action: newSession,
      icon: 'refresh'
    },
    {
      label: lang.tr('module.extensions.header.confSettings'),
      action: toggleSettings,
      icon: 'cog'
    }
  ]

  return (
    <div className={style.header}>
      <Tabs id="contentFormTabs" onChange={updateCurrentTab} defaultSelectedTabId={selectedTab}>
        <Tab id="content" title={lang.tr('module.extensions.header.debugger')} />
        {hasProcessing && <Tab id="processing" title={lang.tr('module.extensions.header.processing')} />}
      </Tabs>
      {<MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />}
    </div>
  )
}
