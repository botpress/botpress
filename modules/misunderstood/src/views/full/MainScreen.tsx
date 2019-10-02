import { Button, ButtonGroup, HTMLTable, Intent } from '@blueprintjs/core'
import clsx from 'clsx'
import React from 'react'

import {
  ApiFlaggedEvent,
  ContextMessage,
  DbFlaggedEvent,
  FLAGGED_MESSAGE_STATUS,
  RESOLUTION_TYPE,
  ResolutionData
} from '../../types'

import style from './style.scss'
import { RESOLUTION } from './util'

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

const ChatPreview = ({ messages }: { messages: ContextMessage[] }) => (
  <div className={style.chatPreview}>
    {messages.map((message, i) => (
      <div
        key={i}
        className={clsx(style.chatPreviewMessage, {
          [style.chatPreviewMessage_Incoming]: message.direction === 'incoming',
          [style.chatPreviewMessage_Outgoing]: message.direction === 'outgoing',
          [style.chatPreviewMessage_Current]: message.isCurrent
        })}
      >
        <div className={style.chatPreviewAvatar}>{message.direction === 'incoming' ? 'U' : 'B'}</div>
        <div className={style.chatPreviewText}>{message.preview}</div>
      </div>
    ))}
  </div>
)

const AmendForm = ({ mode, setMode }) => (
  <div className={style.amendForm}>
    <h5>What is this message type?</h5>

    <ButtonGroup>
      <Button
        onClick={() => {
          if (mode === RESOLUTION_TYPE.intent) {
            return
          }
          setMode(RESOLUTION_TYPE.intent)
        }}
        intent={mode === RESOLUTION_TYPE.intent ? Intent.SUCCESS : Intent.NONE}
      >
        Goal
      </Button>
      <Button
        onClick={() => {
          if (mode === RESOLUTION_TYPE.qna) {
            return
          }
          setMode(RESOLUTION_TYPE.qna)
        }}
        intent={mode === RESOLUTION_TYPE.qna ? Intent.SUCCESS : Intent.NONE}
      >
        Query
      </Button>
      {mode != null && (
        <Button
          onClick={() => {
            setMode(null)
          }}
          icon="undo"
        >
          Undo
        </Button>
      )}
    </ButtonGroup>
  </div>
)

interface NewEventViewProps {
  event: ApiFlaggedEvent
  totalEventsCount: number
  eventIndex: number
  skipEvent: () => void
  deleteEvent: () => void
  amendEvent: (resolutionData: ResolutionData) => void
}

interface NewEventViewState {
  isAmending: boolean
  amendMode: RESOLUTION_TYPE | null
}

class NewEventView extends React.Component<NewEventViewProps, NewEventViewState> {
  state = {
    isAmending: false,
    amendMode: null
  }

  startAmend = () => {
    this.setState({ isAmending: true })
  }

  finishAmend = () => {
    this.setState({ isAmending: false })
  }

  confirmAmend = () => {
    const { amendEvent } = this.props
    if (false) {
      amendEvent({
        resolutionType: RESOLUTION_TYPE.qna,
        resolution: 'xxx'
      })
    }
    this.finishAmend()
  }

  setAmendMode = (amendMode: RESOLUTION_TYPE) => {
    this.setState({ amendMode })
  }

  componentDidMount() {
    this.startAmend()
  }

  render() {
    const { event, totalEventsCount, eventIndex, skipEvent, deleteEvent } = this.props
    const { isAmending, amendMode } = this.state

    return (
      <>
        <h3>
          New Misunderstood | {eventIndex + 1} of {totalEventsCount}
        </h3>

        <ChatPreview messages={event.context} />

        <h4 className={style.newEventPreview}>{event.preview}</h4>

        <ButtonGroup large>
          <Button
            onClick={skipEvent}
            icon="arrow-right"
            intent={Intent.WARNING}
            disabled={isAmending || eventIndex === totalEventsCount - 1}
          >
            Skip
          </Button>
          <Button onClick={deleteEvent} icon="trash" intent={Intent.DANGER} disabled={isAmending}>
            Ignore
          </Button>
          <Button onClick={this.startAmend} icon="confirm" intent={Intent.PRIMARY} disabled={isAmending}>
            Amend
          </Button>
          {isAmending && (
            <>
              <Button onClick={this.confirmAmend} icon="tick" intent={Intent.SUCCESS}>
                Save
              </Button>
              <Button onClick={this.finishAmend} icon="cross" intent={Intent.NONE}>
                Cancel
              </Button>
            </>
          )}
        </ButtonGroup>
        {isAmending && <AmendForm mode={amendMode} setMode={this.setAmendMode} />}
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
