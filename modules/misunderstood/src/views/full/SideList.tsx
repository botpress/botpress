import { Icon, Tab, Tabs } from '@blueprintjs/core'
import clsx from 'clsx'
import React from 'react'

import style from './style.scss'

const STATUSES = [
  {
    key: 'new',
    label: 'New'
  },
  {
    key: 'handled',
    label: 'Done'
  },
  {
    key: 'deleted',
    label: 'Ignored'
  }
]

const REASONS = {
  auto_hook: {
    title: 'Flagged by hook',
    icon: 'build'
  },
  action: {
    title: 'Flagged by action',
    icon: 'code'
  }
}

const SideList = ({
  eventCounts,
  selectedStatus,
  events,
  selectedEventIndex,
  onSelectedStatusChange,
  onSelectedEventChange
}) => {
  if (!eventCounts || selectedStatus == null) {
    return null
  }

  return (
    <div className={style.sideList}>
      <Tabs
        className={style.contentFixed}
        id="StatusSelect"
        onChange={onSelectedStatusChange}
        selectedTabId={selectedStatus}
      >
        {STATUSES.map(({ key, label }) => (
          <Tab id={key} key={key} title={`${label} (${eventCounts[key] || 0})`} />
        ))}
      </Tabs>
      {selectedStatus === 'new' && events && (
        <ul className={clsx(style.contentStretch, style.sideListList)}>
          {events.map((event, i) => (
            <li
              onClick={() => onSelectedEventChange(i)}
              key={event.id}
              className={clsx(style.sideListItem, {
                [style.sideListItemSelected]: i === selectedEventIndex
              })}
            >
              <Icon
                icon={REASONS[event.reason].icon}
                title={REASONS[event.reason].title}
                iconSize={Icon.SIZE_STANDARD}
              />
              &nbsp;
              <span className={style.sideListItemText}>{event.preview}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SideList
