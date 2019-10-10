import { Button, ButtonGroup, Intent } from '@blueprintjs/core'
import { AxiosStatic } from 'axios'
import pick from 'lodash/pick'
import React from 'react'

import { ApiFlaggedEvent, RESOLUTION_TYPE, ResolutionData } from '../../../types'

import style from './style.scss'
import AmendForm from './AmendForm'
import ChatPreview from './ChatPreview'

interface Props {
  axios: AxiosStatic
  language: string
  event: ApiFlaggedEvent
  totalEventsCount: number
  eventIndex: number
  skipEvent: () => void
  deleteEvent: () => void
  amendEvent: (resolutionData: ResolutionData) => void
}

interface State {
  isAmending: boolean
  resolutionType: RESOLUTION_TYPE | null
  resolution: string | null
  resolutionParams: string | object | null
}

class NewEventView extends React.Component<Props, State> {
  state = {
    isAmending: false,
    resolutionType: null,
    resolution: null,
    resolutionParams: null
  }

  startAmend = () => {
    this.setState({ isAmending: true })
  }

  cancelAmend = () => {
    this.setState({ isAmending: false, resolutionType: null, resolution: null, resolutionParams: null })
  }

  confirmAmend = () => {
    const { amendEvent } = this.props
    amendEvent(pick(this.state, 'resolutionType', 'resolution', 'resolutionParams'))
    this.setState({ isAmending: false, resolutionType: null, resolution: null, resolutionParams: null })
  }

  setAmendMode = (resolutionType: RESOLUTION_TYPE) => {
    this.setState({ resolutionType })
  }

  selectResolution = (resolution: string | null) => {
    this.setState({
      resolution
    })
  }

  updateResolutionParams = (resolutionParams: string | object | null) => {
    this.setState({
      resolutionParams: resolutionParams || null
    })
  }

  render() {
    const { axios, language, event, totalEventsCount, eventIndex, skipEvent, deleteEvent } = this.props
    const { isAmending, resolutionType, resolution, resolutionParams } = this.state

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
        </ButtonGroup>

        {isAmending && (
          <AmendForm
            language={language}
            axios={axios}
            event={event}
            mode={resolutionType}
            setMode={this.setAmendMode}
            resolution={resolution}
            resolutionParams={resolutionParams}
            onSelect={this.selectResolution}
            onParamsUpdate={this.updateResolutionParams}
            onSave={this.confirmAmend}
            onCancel={this.cancelAmend}
          />
        )}
      </>
    )
  }
}

export default NewEventView
