import { AxiosStatic } from 'axios'
import { Container, SidePanel, SplashScreen } from 'botpress/ui'
import classnames from 'classnames'
import React from 'react'

import { FLAGGED_MESSAGE_STATUS, FlaggedEvent, ResolutionData } from '../../types'

import style from './style.scss'
import ApiClient from './ApiClient'
import MainScreen from './MainScreen'
import SidePanelContent from './SidePanel'

const getDefaultLanguage = (languages: string[]) => {
  if (languages.includes('en')) {
    return 'en'
  }
  return languages[0]
}

const INITIAL_STATUS = FLAGGED_MESSAGE_STATUS.new

interface Props {
  bp: {
    axios: AxiosStatic
  }
}

interface State {
  loaded: boolean | null
  languages: string[] | null
  language: string | null
  eventCounts: { [status: string]: number } | null
  selectedStatus: FLAGGED_MESSAGE_STATUS
  events: FlaggedEvent[] | null
  selectedEventIndex: number | null
  selectedEvent: FlaggedEvent | null
}

export default class MisunderstoodMainView extends React.Component<Props, State> {
  state = {
    loaded: false,
    languages: null,
    language: null,
    eventCounts: null,
    selectedStatus: INITIAL_STATUS,
    events: null,
    selectedEventIndex: null,
    selectedEvent: null
  }

  apiClient: ApiClient

  constructor(props: Props) {
    super(props)
    this.apiClient = new ApiClient(props.bp.axios)
  }

  fetchEventCounts(language: string) {
    return this.apiClient.getEventCounts(language)
  }

  fetchEvents(language: string, status: string) {
    return this.apiClient.getEvents(language, status)
  }

  fetchEvent(id: string) {
    return this.apiClient.getEvent(id)
  }

  async componentDidMount() {
    const languages = await this.apiClient.get('/').then(data => data.languages)

    await this.setStateP({
      languages,
      loaded: true
    })

    const language = getDefaultLanguage(languages)
    await this.setLanguage(language)
  }

  setStateP<K extends keyof State>(update: Pick<State, K>) {
    return new Promise(resolve => {
      this.setState(update, () => {
        resolve()
      })
    })
  }

  updateEventsCounts = async (language?: string) => {
    const eventCounts = await this.fetchEventCounts(language || this.state.language)
    await this.setStateP({ eventCounts })
  }

  setLanguage = async (language: string) => {
    await this.setStateP({ language, eventCounts: null, events: null, selectedEventIndex: null, selectedEvent: null })
    await Promise.all([this.setEventsStatus(INITIAL_STATUS), this.updateEventsCounts(language)])
  }

  setEventsStatus = async (selectedStatus: FLAGGED_MESSAGE_STATUS) => {
    await this.setStateP({ selectedStatus, events: null, selectedEventIndex: null, selectedEvent: null })
    const events = await this.fetchEvents(this.state.language, selectedStatus)
    await this.setStateP({ events })
    await this.setEventIndex(0)
  }

  setEventIndex = async (selectedEventIndex: number) => {
    const { events } = this.state
    if (selectedEventIndex >= events.length) {
      selectedEventIndex = events.length - 1
    }
    await this.setStateP({ selectedEventIndex, selectedEvent: null })
    if (events && events.length) {
      const event = await this.fetchEvent(events[selectedEventIndex].id)
      await this.setStateP({ selectedEvent: event })
    }
  }

  skipCurrentEvent = () => {
    const { selectedEventIndex, eventCounts, selectedStatus } = this.state
    if (
      selectedStatus === FLAGGED_MESSAGE_STATUS.new &&
      eventCounts &&
      selectedEventIndex < eventCounts[selectedStatus]
    ) {
      return this.setEventIndex(selectedEventIndex + 1)
    }
  }

  async alterNewEventsList(oldStatus: FLAGGED_MESSAGE_STATUS, newStatus: FLAGGED_MESSAGE_STATUS) {
    // do some local state patching to prevent unneeded content flash
    const { eventCounts, selectedEventIndex, events, selectedEvent } = this.state
    const newEventCounts = {
      ...eventCounts,
      [oldStatus]: eventCounts[oldStatus] - 1,
      [newStatus]: (eventCounts[newStatus] || 0) + 1
    }
    await this.setStateP({
      eventCounts: newEventCounts,
      selectedEvent: null,
      events: events.filter(event => event.id !== selectedEvent.id)
    })

    // advance to the next event
    await this.setEventIndex(selectedEventIndex)

    await this.updateEventsCounts()
  }

  deleteCurrentEvent = async () => {
    const { selectedEvent } = this.state

    if (selectedEvent) {
      await this.apiClient.updateStatus(selectedEvent.id, FLAGGED_MESSAGE_STATUS.deleted)

      return this.alterNewEventsList(FLAGGED_MESSAGE_STATUS.new, FLAGGED_MESSAGE_STATUS.deleted)
    }
  }

  undeleteEvent = async (id: string) => {
    await this.apiClient.updateStatus(id, FLAGGED_MESSAGE_STATUS.new)
    return this.alterNewEventsList(FLAGGED_MESSAGE_STATUS.deleted, FLAGGED_MESSAGE_STATUS.new)
  }

  resetPendingEvent = async (id: string) => {
    await this.apiClient.updateStatus(id, FLAGGED_MESSAGE_STATUS.new)
    return this.alterNewEventsList(FLAGGED_MESSAGE_STATUS.pending, FLAGGED_MESSAGE_STATUS.new)
  }

  amendCurrentEvent = async (resolutionData: ResolutionData) => {
    const { selectedEvent } = this.state

    await this.apiClient.updateStatus(selectedEvent.id, FLAGGED_MESSAGE_STATUS.pending, resolutionData)
    return this.alterNewEventsList(FLAGGED_MESSAGE_STATUS.new, FLAGGED_MESSAGE_STATUS.pending)
  }

  applyAllPending = async () => {
    await this.apiClient.applyAllPending()
    await this.updateEventsCounts()
    return this.setEventsStatus(FLAGGED_MESSAGE_STATUS.applied)
  }

  render() {
    const {
      loaded,
      languages,
      language,
      eventCounts,
      selectedStatus,
      events,
      selectedEventIndex,
      selectedEvent
    } = this.state

    const dataLoaded = selectedStatus === FLAGGED_MESSAGE_STATUS.new ? selectedEvent : events

    return (
      <Container sidePanelWidth={320}>
        <SidePanel>
          {loaded && (
            <SidePanelContent
              languages={languages}
              language={language}
              eventCounts={eventCounts}
              selectedStatus={selectedStatus}
              events={events}
              selectedEventIndex={selectedEventIndex}
              onLanguageChange={this.setLanguage}
              onSelectedStatusChange={this.setEventsStatus}
              onSelectedEventChange={this.setEventIndex}
              applyAllPending={this.applyAllPending}
            />
          )}
        </SidePanel>

        {loaded && eventCounts && dataLoaded ? (
          <div className={classnames(style.padded, style.mainView)}>
            <MainScreen
              axios={this.props.bp.axios}
              language={language}
              selectedEvent={selectedEvent}
              selectedEventIndex={selectedEventIndex}
              totalEventsCount={eventCounts[selectedStatus] || 0}
              selectedStatus={selectedStatus}
              events={events}
              skipEvent={this.skipCurrentEvent}
              deleteEvent={this.deleteCurrentEvent}
              undeleteEvent={this.undeleteEvent}
              resetPendingEvent={this.resetPendingEvent}
              amendEvent={this.amendCurrentEvent}
              applyAllPending={this.applyAllPending}
            />
          </div>
        ) : (
            <SplashScreen title="Loading..." description="Please wait while we're loading data" />
          )}
      </Container>
    )
  }
}
