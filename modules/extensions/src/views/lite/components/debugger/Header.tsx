import React, { useState } from 'react'

import MoreOptions from '../../../../../../../src/bp/ui-shared-lite/MoreOptions'
import { MoreOptionsItems } from '../../../../../../../src/bp/ui-shared-lite/MoreOptions/typings'
import Tabs from '../../../../../../../src/bp/ui-shared-lite/Tabs'
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

  const tabs = [
    {
      id: 'content',
      title: lang.tr('module.extensions.header.debugger')
    }
  ]
  if (hasProcessing) {
    tabs.push({
      id: 'processing',
      title: lang.tr('module.extensions.header.processing')
    })
  }

  return (
    <div className={style.header}>
      <Tabs tabChange={updateCurrentTab} currentTab={selectedTab} tabs={tabs} />
      {<MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />}
    </div>
  )
}
