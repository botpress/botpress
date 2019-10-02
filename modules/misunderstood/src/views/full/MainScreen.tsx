import { Button, ButtonGroup, HTMLTable, Intent } from '@blueprintjs/core'
import React from 'react'

import { DbFlaggedEvent, FLAGGED_MESSAGE_STATUS, FlaggedEvent, ResolutionData } from '../../types'

import style from './style.scss'
import { REASONS, RESOLUTION } from './util'

const DeletedList = ({
  events,
  totalEventsCount,
  undeleteEvent
}: {
  events: DbFlaggedEvent[]
  totalEventsCount: number
  undeleteEvent: (id: string) => void
}) => (
  <>
    <h3>Ignored Misunderstood ({totalEventsCount})</h3>
    {events && !!events.length && (
      <HTMLTable condensed interactive striped>
        <thead>
          <tr>
            <td>Phrase</td>
            <td>Deleted</td>
            <td>&nbsp;</td>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr key={i}>
              <td>{event.preview}</td>
              <td>{event.updatedAt}</td>
              <td>
                <Button onClick={() => undeleteEvent('' + event.id)} small icon="refresh" intent={Intent.PRIMARY}>
                  Restore
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    )}
  </>
)

const ResolvedEventsList = ({ events }) =>
  events &&
  !!events.length && (
    <HTMLTable condensed interactive striped>
      <thead>
        <tr>
          <td>Phrase</td>
          <td>Resolution</td>
          <td>Updated</td>
        </tr>
      </thead>
      <tbody>
        {events.map((event, i) => (
          <tr key={i}>
            <td>{event.preview}</td>
            <td>
              {RESOLUTION[event.resolutionType]} {event.resolution}
              {event.resolutionParams && (
                <pre>
                  <code>{JSON.stringify(event.resolutionParams, null, 2)}</code>
                </pre>
              )}
            </td>
            <td>{event.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </HTMLTable>
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
  <>
    <h3>Pending Misunderstood ({totalEventsCount})</h3>
    <div>
      {events && events.length > 0 && (
        <Button onClick={applyAllPending} intent={Intent.WARNING} icon="export" className="bp3-fill">
          Apply all pending
        </Button>
      )}
    </div>
    <ResolvedEventsList events={events} />
  </>
)

const AppliedList = ({ events, totalEventsCount }: { events: DbFlaggedEvent[]; totalEventsCount: number }) => (
  <>
    <h3>Applied Misunderstood ({totalEventsCount})</h3>
    <ResolvedEventsList events={events} />
  </>
)

interface NewEventViewProps {
  event?: FlaggedEvent
  totalEventsCount: number
  eventIndex: number
  skipEvent: () => void
  deleteEvent: () => void
  amendEvent: (resolutionData: ResolutionData) => void
}

class NewEventView extends React.Component<NewEventViewProps> {
  render() {
    const { event, totalEventsCount, eventIndex, skipEvent, deleteEvent, amendEvent } = this.props

    return (
      <>
        <h3>
          New Misunderstood | {eventIndex + 1} of {totalEventsCount}
        </h3>
        <h4 className={style.newEventPreview}>{event.preview}</h4>
        <ButtonGroup large>
          <Button
            onClick={skipEvent}
            icon="arrow-right"
            intent={Intent.WARNING}
            disabled={eventIndex === totalEventsCount - 1}
          >
            Skip
          </Button>
          <Button onClick={deleteEvent} icon="trash" intent={Intent.DANGER}>
            Ignore
          </Button>
          <Button icon="confirm" intent={Intent.PRIMARY}>
            Amend
          </Button>
        </ButtonGroup>
      </>
    )
  }
}

const MainScreen = ({
  selectedEvent,
  selectedStatus,
  events,
  selectedEventIndex,
  totalEventsCount,
  skipEvent,
  deleteEvent,
  undeleteEvent,
  amendEvent,
  applyAllPending
}) => {
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.deleted) {
    return <DeletedList events={events} totalEventsCount={totalEventsCount} undeleteEvent={undeleteEvent} />
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
