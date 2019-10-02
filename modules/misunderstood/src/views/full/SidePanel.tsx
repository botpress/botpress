import { Divider } from '@blueprintjs/core'
import clsx from 'clsx'
import React from 'react'

import style from './style.scss'
import LanguageSwitch from './LanguageSwitch'
import SideList from './SideList'

const SidePanel = ({
  languages,
  language,
  eventCounts,
  selectedStatus,
  events,
  selectedEventIndex,
  onLanguageChange,
  onSelectedStatusChange,
  onSelectedEventChange,
  applyAllPending
}) => (
  <div className={style.sidePanel}>
    <div className={clsx(style.sidePanelContent, style.contentFixed)}>
      <LanguageSwitch languages={languages} language={language} onChage={onLanguageChange} />
    </div>
    <Divider />
    <div className={clsx(style.sidePanelContent, style.contentStretch, style.sidePanelContentStretch)}>
      <SideList
        eventCounts={eventCounts}
        selectedStatus={selectedStatus}
        events={events}
        selectedEventIndex={selectedEventIndex}
        onSelectedStatusChange={onSelectedStatusChange}
        onSelectedEventChange={onSelectedEventChange}
        applyAllPending={applyAllPending}
      />
    </div>
  </div>
)

export default SidePanel
