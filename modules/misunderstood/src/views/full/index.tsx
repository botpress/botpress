import { AxiosStatic } from 'axios'
import { lang } from 'botpress/shared'
import { Container, SidePanel, SplashScreen } from 'botpress/ui'
import classnames from 'classnames'
import React from 'react'

import { FlaggedEvent, FLAGGED_MESSAGE_STATUS, ResolutionData } from '../../types'

import style from './style.scss'
import ApiClient from './ApiClient'
import MainScreen from './MainScreen'
import SidePanelContent from './SidePanel'

interface Props {
  contentLang: string
  bp: {
    axios: AxiosStatic
  }
}

interface State {
  languages: string[] | null
  language: string | null
  eventCounts: { [status: string]: number } | null
  selectedStatus: FLAGGED_MESSAGE_STATUS
  events: FlaggedEvent[] | null
  selectedEventIndex: number | null
  selectedEvent: FlaggedEvent | null
  eventNotFound: boolean
}

export default class MisunderstoodMainView extends React.Component<Props, State> {
  state = {
    languages: null,
    language: null,
    eventCounts: null,
    selectedStatus: FLAGGED_MESSAGE_STATUS.new,
    events: null,
    selectedEventIndex: null,
    selectedEvent: null,
    eventNotFound: false
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

  async fetchEvent(id: string) {
    try {
      return await this.apiClient.getEvent(id)
    } catch (e) {
      if (e.isAxiosError && e.response.status === 404) {
        return
      }
      throw e
    }
  }

  async componentDidMount() {
    await this.setLanguage(this.props.contentLang)
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
    await Promise.all([this.setEventsStatus(FLAGGED_MESSAGE_STATUS.new), this.updateEventsCounts(language)])
  }

  setEventsStatus = async (selectedStatus: FLAGGED_MESSAGE_STATUS) => {
    await this.setStateP({ selectedStatus, events: null, selectedEventIndex: null, selectedEvent: null })
    const events = await this.fetchEvents(this.state.language, selectedStatus)
    await this.setStateP({ events })
    await this.setEventIndex(0)
    await this.updateEventsCounts()
  }

  setEventIndex = async (selectedEventIndex: number) => {
    const { events } = this.state
    if (selectedEventIndex >= events.length) {
      selectedEventIndex = events.length - 1
    }
    await this.setStateP({ selectedEventIndex, selectedEvent: null })
    if (events && events.length) {
      const event = await this.fetchEvent(events[selectedEventIndex].id)
      await this.setStateP({ selectedEvent: event, eventNotFound: !event })
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

  async alterEventsList(oldStatus: FLAGGED_MESSAGE_STATUS, newStatus: FLAGGED_MESSAGE_STATUS) {
    // do some local state patching to prevent unneeded content flash
    const { eventCounts, selectedEventIndex, events } = this.state
    const newEventCounts = {
      ...eventCounts,
      [oldStatus]: eventCounts[oldStatus] - 1,
      [newStatus]: (eventCounts[newStatus] || 0) + 1
    }
    await this.setStateP({
      eventCounts: newEventCounts,
      selectedEvent: null,
      events: events.filter(event => event.id !== events[selectedEventIndex].id)
    })

    // advance to the next event
    await this.setEventIndex(selectedEventIndex)

    // update the real events counts from the back-end
    await this.updateEventsCounts()
  }

  deleteCurrentEvent = async () => {
    await this.apiClient.updateStatus(
      this.state.events[this.state.selectedEventIndex].id,
      FLAGGED_MESSAGE_STATUS.deleted
    )

    return this.alterEventsList(FLAGGED_MESSAGE_STATUS.new, FLAGGED_MESSAGE_STATUS.deleted)
  }

  undeleteEvent = async (id: string) => {
    await this.apiClient.updateStatus(id, FLAGGED_MESSAGE_STATUS.new)
    return this.alterEventsList(FLAGGED_MESSAGE_STATUS.deleted, FLAGGED_MESSAGE_STATUS.new)
  }

  resetPendingEvent = async (id: string) => {
    await this.apiClient.updateStatus(id, FLAGGED_MESSAGE_STATUS.new)
    return this.alterEventsList(FLAGGED_MESSAGE_STATUS.pending, FLAGGED_MESSAGE_STATUS.new)
  }

  amendCurrentEvent = async (resolutionData: ResolutionData) => {
    await this.apiClient.updateStatus(
      this.state.events[this.state.selectedEventIndex].id,
      FLAGGED_MESSAGE_STATUS.pending,
      resolutionData
    )
    return this.alterEventsList(FLAGGED_MESSAGE_STATUS.new, FLAGGED_MESSAGE_STATUS.pending)
  }

  applyAllPending = async () => {
    await this.apiClient.applyAllPending()
    await this.updateEventsCounts()
    return this.setEventsStatus(FLAGGED_MESSAGE_STATUS.applied)
  }

  async componentDidUpdate(prevProps: Props) {
    if (prevProps.contentLang !== this.props.contentLang) {
      await this.setLanguage(this.props.contentLang)
    }
  }

  render() {
    const { eventCounts, selectedStatus, events, selectedEventIndex, selectedEvent, eventNotFound } = this.state

    const { contentLang } = this.props

    const dataLoaded =
      selectedStatus === FLAGGED_MESSAGE_STATUS.new ? selectedEvent || (events && events.length === 0) : events

    return (
      <Container sidePanelWidth={320}>
        <SidePanel>
          <SidePanelContent
            eventCounts={eventCounts}
            selectedStatus={selectedStatus}
            events={events}
            selectedEventIndex={selectedEventIndex}
            onSelectedStatusChange={this.setEventsStatus}
            onSelectedEventChange={this.setEventIndex}
            applyAllPending={this.applyAllPending}
          />
        </SidePanel>

        {eventCounts && (dataLoaded || eventNotFound) ? (
          <div className={classnames(style.padded, style.mainView, style.withStickyActionBar)}>
            <MainScreen
              axios={this.props.bp.axios}
              language={contentLang}
              selectedEvent={selectedEvent}
              eventNotFound={eventNotFound}
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
          <SplashScreen
            title={lang.tr('module.misunderstood.loading')}
            description={lang.tr('module.misunderstood.waitWhileDataLoading')}
          />
        )}
      </Container>
    )
  }
}
