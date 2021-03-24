import classnames from 'classnames'
import React from 'react'

import SideList from './SideList'
import style from './style.scss'

const SidePanel = ({
  eventCounts,
  selectedStatus,
  events,
  selectedEventIndex,
  onSelectedStatusChange,
  onSelectedEventChange,
  applyAllPending,
  deleteAllStatus
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
        deleteAllStatus={deleteAllStatus}
      />
    </div>
  </div>
)

export default SidePanel
