import classnames from 'classnames'
import React from 'react'

import style from './style.scss'
import SideList from './SideList'

const SidePanel = ({
  eventCounts,
  selectedStatus,
  events,
  selectedEventIndex,
  onSelectedStatusChange,
  onSelectedEventChange,
  applyAllPending
}) => (
  <div className={style.sidePanel}>
    <div className={classnames(style.contentStretch, style.sidePanelContentStretch)}>
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
