import { Button, ButtonGroup, Intent } from '@blueprintjs/core'
import React from 'react'

import { ApiFlaggedEvent, RESOLUTION_TYPE, ResolutionData } from '../../../types'

import style from './style.scss'
import AmendForm from './AmendForm'
import ChatPreview from './ChatPreview'

interface Props {
  event: ApiFlaggedEvent
  totalEventsCount: number
  eventIndex: number
  skipEvent: () => void
  deleteEvent: () => void
  amendEvent: (resolutionData: ResolutionData) => void
}

interface State {
  isAmending: boolean
  amendMode: RESOLUTION_TYPE | null
}

class NewEventView extends React.Component<Props, State> {
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

export default NewEventView
