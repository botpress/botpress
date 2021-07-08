import { Button, Icon, Intent, Tab, Tabs, Checkbox } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import React from 'react'

import { FLAGGED_MESSAGE_STATUS } from '../../types'

import { groupEventsByUtterance } from './eventUtils'
import style from './style.scss'
import { REASONS, STATUSES } from './util'

const SideList = ({
  eventCounts,
  selectedStatus,
  events,
  checkedEventIds,
  selectedEventIndex,
  onSelectedStatusChange,
  onSelectedEventChange,
  applyAllPending,
  deleteAllStatus,
  onEventCheckedOrUnchecked,
  selectAllChecked,
  onSelectAllChanged
}) => {
  if (!eventCounts || selectedStatus == null) {
    return null
  }

  const newEvents = []
  let eventsByUtterance
  if (events) {
    eventsByUtterance = groupEventsByUtterance(events)
    eventsByUtterance.forEach(function(events, utterance) {
      const { event, eventIndex } = events[0]
      newEvents.push({
        event,
        preview: events.length > 1 ? `${event.preview} (${events.length})` : event.preview,
        eventIndex
      })
    })
  }
  const areEvents = events && events.length > 0

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

      {selectedStatus === FLAGGED_MESSAGE_STATUS.pending && areEvents && (
        <div className={style.applyAllButton}>
          <Button onClick={applyAllPending} intent={Intent.WARNING} icon="export" fill>
            {lang.tr('module.misunderstood.applyAllPending')}
          </Button>
        </div>
      )}

      {selectedStatus === FLAGGED_MESSAGE_STATUS.applied && areEvents && (
        <div className={style.applyAllButton}>
          <Button onClick={deleteAllStatus(FLAGGED_MESSAGE_STATUS.applied)} intent={Intent.WARNING} icon="delete" fill>
            {lang.tr('module.misunderstood.deleteAllDone')}
          </Button>
        </div>
      )}

      {selectedStatus === FLAGGED_MESSAGE_STATUS.deleted && areEvents && (
        <div className={style.applyAllButton}>
          <Button onClick={deleteAllStatus(FLAGGED_MESSAGE_STATUS.deleted)} intent={Intent.WARNING} icon="delete" fill>
            {lang.tr('module.misunderstood.deleteAllIgnored')}
          </Button>
        </div>
      )}

      {selectedStatus === FLAGGED_MESSAGE_STATUS.new && newEvents.length > 0 && (
        <div className={classnames(style.sideListItem)}>
          <Checkbox checked={selectAllChecked} onChange={() => onSelectAllChanged()}>
            {lang.tr('module.misunderstood.selectAll')}
          </Checkbox>
        </div>
      )}

      {selectedStatus === FLAGGED_MESSAGE_STATUS.new && newEvents.length > 0 && (
        <ul className={classnames(style.contentStretch, style.sideListList)}>
          {newEvents.map(({ event, preview, eventIndex }) => (
            <li
              onClick={() => onSelectedEventChange(eventIndex)}
              key={event.id}
              className={classnames(style.sideListItem, {
                [style.sideListItemSelected]: eventIndex === selectedEventIndex
              })}
            >
              <Checkbox
                checked={checkedEventIds.includes(event.id)}
                onChange={() =>
                  onEventCheckedOrUnchecked(eventsByUtterance.get(event.preview).map(({ event: { id } }) => id))
                }
              >
                <Icon
                  icon={REASONS[event.reason].icon}
                  title={REASONS[event.reason].title}
                  iconSize={Icon.SIZE_STANDARD}
                />
                &nbsp;
                <span className={style.sideListItemText}>{preview}</span>
              </Checkbox>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SideList
