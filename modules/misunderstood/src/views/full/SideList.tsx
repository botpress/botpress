import { Button, Icon, Intent, Tab, Tabs } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import React from 'react'

import { FLAGGED_MESSAGE_STATUS } from '../../types'

import style from './style.scss'
import { REASONS, STATUSES } from './util'

const SideList = ({
  eventCounts,
  selectedStatus,
  events,
  selectedEventIndex,
  onSelectedStatusChange,
  onSelectedEventChange,
  applyAllPending
}) => {
  if (!eventCounts || selectedStatus == null) {
    return null
  }

  return (
    <div className={style.sideList}>
      <Tabs
        className={classnames(style.contentFixed, style.headerTabs)}
        id="StatusSelect"
        onChange={onSelectedStatusChange}
        selectedTabId={selectedStatus}
      >
        {STATUSES.map(({ key, label }) => (
          <Tab id={key} key={key} title={`${label} (${eventCounts[key] || 0})`} />
        ))}
      </Tabs>

      {selectedStatus === FLAGGED_MESSAGE_STATUS.pending && events && events.length > 0 && (
        <div className={style.applyAllButton}>
          <Button onClick={applyAllPending} intent={Intent.WARNING} icon="export" fill>
            {lang.tr('module.misunderstood.applyAllPending')}
          </Button>
        </div>
      )}

      {selectedStatus === FLAGGED_MESSAGE_STATUS.new && events && (
        <ul className={classnames(style.contentStretch, style.sideListList)}>
          {events.map((event, i) => (
            <li
              onClick={() => onSelectedEventChange(i)}
              key={event.id}
              className={classnames(style.sideListItem, {
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
