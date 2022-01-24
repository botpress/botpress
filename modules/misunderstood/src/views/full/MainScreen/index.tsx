import { lang } from 'botpress/shared'
import React from 'react'

import { FLAGGED_MESSAGE_STATUS } from '../../../types'

import AppliedList from './AppliedList'
import DeletedList from './DeletedList'
import NewEventView from './NewEventView'
import PendingList from './PendingList'

const MainScreen = ({
  axios,
  language,
  selectedEvent,
  selectedStatus,
  events,
  selectedEventIndex,
  eventNotFound,
  totalEventsCount,
  skipEvent,
  deleteEvent,
  undeleteEvent,
  resetPendingEvent,
  amendEvent,
  applyAllPending,
  manyEventsSelected
}) => {
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.deleted) {
    return <DeletedList events={events} totalEventsCount={totalEventsCount} undeleteEvent={undeleteEvent} />
  }
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.pending) {
    return (
      <PendingList
        events={events}
        totalEventsCount={totalEventsCount}
        resetPendingEvent={resetPendingEvent}
        applyAllPending={applyAllPending}
      />
    )
  }
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.applied) {
    return <AppliedList events={events} totalEventsCount={totalEventsCount} />
  }

  if (selectedStatus === FLAGGED_MESSAGE_STATUS.new && events && events.length === 0) {
    return <div>{lang.tr('module.misunderstood.noNewEvents')}</div>
  }

  return (
    <NewEventView
      language={language}
      axios={axios}
      event={selectedEvent}
      eventNotFound={eventNotFound}
      totalEventsCount={totalEventsCount}
      eventIndex={selectedEventIndex}
      skipEvent={skipEvent}
      deleteEvent={deleteEvent}
      amendEvent={amendEvent}
      manyEventsSelected={manyEventsSelected}
    />
  )
}

export default MainScreen
