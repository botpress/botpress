import { Button, HTMLTable, Intent } from '@blueprintjs/core'
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

const PendingList = ({
  events,
  totalEventsCount,
  applyAllPending
}: {
  events: DbFlaggedEvent[]
  totalEventsCount: number
  applyAllPending: () => Promise<void>
}) => (
  <div>
    <h3>Pending Misunderstood ({totalEventsCount})</h3>
    <div>
      {events && events.length > 0 && (
        <Button onClick={applyAllPending} intent={Intent.WARNING} icon="export" className="bp3-fill">
          Apply all pending
        </Button>
      )}
    </div>
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

const NewEventView = ({ event, totalEventsCount, eventIndex, skipEvent, deleteEvent, amendEvent }) => {
  return (
    <div>
      <h3>
        New Misunderstood | {eventIndex + 1} of {totalEventsCount}
      </h3>
      <h4>{event.preview}</h4>
    </div>
  )
}

const MainScreen = ({
  selectedEvent,
  selectedStatus,
  events,
  selectedEventIndex,
  totalEventsCount,
  skipEvent,
  deleteEvent,
  amendEvent,
  applyAllPending
}) => {
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.deleted) {
    return <DeletedList events={events} totalEventsCount={totalEventsCount} />
  }
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.pending) {
    return <PendingList events={events} totalEventsCount={totalEventsCount} applyAllPending={applyAllPending} />
  }
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.applied) {
    return <AppliedList events={events} totalEventsCount={totalEventsCount} />
  }

  return (
    <NewEventView
      event={selectedEvent}
      totalEventsCount={totalEventsCount}
      eventIndex={selectedEventIndex}
      skipEvent={skipEvent}
      deleteEvent={deleteEvent}
      amendEvent={amendEvent}
    />
  )
}

export default MainScreen
