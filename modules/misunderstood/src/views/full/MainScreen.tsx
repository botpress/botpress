import { HTMLTable } from '@blueprintjs/core'
import React from 'react'

import { DbFlaggedEvent, FLAGGED_MESSAGE_STATUS } from '../../types'

import { REASONS } from './util'

const DeletedList = ({ events, totalEventsCount }: { events: DbFlaggedEvent[]; totalEventsCount: number }) => (
  <div>
    <h3>Ignored Misunderstood ({totalEventsCount})</h3>
    {events && !!events.length && (
      <HTMLTable condensed interactive striped>
        <thead>
          <tr>
            <td>Phrase</td>
            <td>Date</td>
            <td>Move back to new</td>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr key={i}>
              <td>{event.preview}</td>
              <td>{event.updatedAt}</td>
              <td>[undelete]</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    )}
  </div>
)

const PendingList = ({ events, totalEventsCount }: { events: DbFlaggedEvent[]; totalEventsCount: number }) => (
  <div>
    <h3>Pending Misunderstood ({totalEventsCount})</h3>
    {events && !!events.length && (
      <HTMLTable condensed interactive striped>
        <thead>
          <tr>
            <td>Phrase</td>
            <td>Date</td>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr key={i}>
              <td>{event.preview}</td>
              <td>{event.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    )}
  </div>
)

const AppliedList = ({ events, totalEventsCount }: { events: DbFlaggedEvent[]; totalEventsCount: number }) => (
  <div>
    <h3>Applied Misunderstood ({totalEventsCount})</h3>
    {events && !!events.length && (
      <HTMLTable condensed interactive striped>
        <thead>
          <tr>
            <td>Phrase</td>
            <td>Date</td>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr key={i}>
              <td>{event.preview}</td>
              <td>{event.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    )}
  </div>
)

const NewEventView = ({ event, totalEventsCount, eventIndex }) => {
  return (
    <div>
      <h3>
        New Misunderstood | {eventIndex + 1} of {totalEventsCount}
      </h3>
      <p>{event.preview}</p>
    </div>
  )
}

const MainScreen = ({ selectedEvent, selectedStatus, events, selectedEventIndex, totalEventsCount }) => {
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.deleted) {
    return <DeletedList events={events} totalEventsCount={totalEventsCount} />
  }
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.pending) {
    return <PendingList events={events} totalEventsCount={totalEventsCount} />
  }
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.applied) {
    return <AppliedList events={events} totalEventsCount={totalEventsCount} />
  }

  return <NewEventView event={selectedEvent} totalEventsCount={totalEventsCount} eventIndex={selectedEventIndex} />
}

export default MainScreen
