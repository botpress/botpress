import { Button, Popover } from '@blueprintjs/core'
import { DateRange, DateRangePicker } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import { AxiosStatic } from 'axios'
import { date, lang } from 'botpress/shared'
import { Container, SidePanel, SplashScreen } from 'botpress/ui'
import classnames from 'classnames'
import React from 'react'

import { DbFlaggedEvent, FLAGGED_MESSAGE_STATUS, FLAG_REASON, ResolutionData } from '../../types'

import ApiClient from './ApiClient'
import MainScreen from './MainScreen'
import SidePanelContent from './SidePanel'
import style from './style.scss'

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
  events: DbFlaggedEvent[] | null
  selectedEventIndex: number | null
  selectedEvent: DbFlaggedEvent | null
  eventNotFound: boolean
  dateRange?: DateRange
  reason?: FLAG_REASON
}

const shortcuts = date.createDateRangeShortcuts()

export default class MisunderstoodMainView extends React.Component<Props, State> {
  state: State = {
    languages: null,
    language: null,
    eventCounts: null,
    selectedStatus: FLAGGED_MESSAGE_STATUS.new,
    events: null,
    selectedEventIndex: null,
    selectedEvent: null,
    eventNotFound: false,
    dateRange: undefined,
    reason: undefined
  }

  apiClient: ApiClient

  constructor(props: Props) {
    super(props)
    this.apiClient = new ApiClient(props.bp.axios)
  }

  fetchEventCounts(language: string, dataRange?: DateRange, reason?: FLAG_REASON) {
    return this.apiClient.getEventCounts(language, dataRange ?? this.state.dateRange, reason)
  }

  fetchEvents(language: string, status: string, dataRange?: DateRange, reason?: FLAG_REASON) {
    return this.apiClient.getEvents(language, status, dataRange || this.state.dateRange, reason)
  }

  async fetchEvent(id: number) {
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

  updateEventsCounts = async (language?: string, dateRange?: DateRange, reason?: FLAG_REASON) => {
    const eventCounts = await this.fetchEventCounts(
      language || this.state.language,
      dateRange || this.state.dateRange,
      reason !== undefined ? reason : this.state.reason
    )
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

  undeleteEvent = async (id: number) => {
    await this.apiClient.updateStatus(id, FLAGGED_MESSAGE_STATUS.new)
    return this.alterEventsList(FLAGGED_MESSAGE_STATUS.deleted, FLAGGED_MESSAGE_STATUS.new)
  }

  resetPendingEvent = async (id: number) => {
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

  deleteAllStatus = (status: FLAGGED_MESSAGE_STATUS) => {
    return async () => {
      await this.apiClient.deleteAll(status)
      await this.updateEventsCounts()
      return this.setEventsStatus(FLAGGED_MESSAGE_STATUS.applied)
    }
  }

  async componentDidUpdate(prevProps: Props) {
    if (prevProps.contentLang !== this.props.contentLang) {
      await this.setLanguage(this.props.contentLang)
    }
  }

  fetchEventsAndCounts = async (language: string, dataRange?: DateRange, reason?: FLAG_REASON) => {
    const eventCounts = await this.fetchEventCounts(
      language || this.state.language,
      dataRange || this.state.dateRange,
      reason !== undefined ? reason : this.state.reason
    )
    const events = await this.fetchEvents(
      language || this.state.language,
      this.state.selectedStatus,
      dataRange || this.state.dateRange,
      reason !== undefined ? reason : this.state.reason
    )

    let firstEvent = null
    if (events && events.length) {
      firstEvent = await this.fetchEvent(events[0].id)
    }

    return { eventCounts, events, firstEvent }
  }

  handleDateChange = async (dateRange: DateRange) => {
    const { eventCounts, events, firstEvent } = await this.fetchEventsAndCounts(this.state.language, dateRange)

    await this.setStateP({
      dateRange,
      events,
      selectedEventIndex: 0,
      selectedEvent: firstEvent,
      eventNotFound: !firstEvent,
      eventCounts
    })
  }

  handleReasonChange = async (reason: FLAG_REASON) => {
    reason = this.state.reason !== reason ? reason : null

    const { eventCounts, events, firstEvent } = await this.fetchEventsAndCounts(
      this.state.language,
      this.state.dateRange,
      reason
    )

    await this.setStateP({
      events,
      selectedEventIndex: 0,
      selectedEvent: firstEvent,
      eventNotFound: !firstEvent,
      eventCounts,
      reason
    })
  }

  render() {
    const { eventCounts, selectedStatus, events, selectedEventIndex, selectedEvent, eventNotFound } = this.state

    const { contentLang } = this.props

    const dataLoaded =
      selectedStatus === FLAGGED_MESSAGE_STATUS.new ? selectedEvent || (events && events.length === 0) : events

    return (
      <Container sidePanelWidth={320}>
        <SidePanel style={{ overflowY: 'hidden' }}>
          <div className={style.filterContainer}>
            <Button
              className={(this.state.reason === FLAG_REASON.auto_hook && 'selected') || ''}
              onClick={() => this.handleReasonChange(FLAG_REASON.auto_hook)}
            >
              {lang.tr('module.misunderstood.misunderstood').toUpperCase()}
            </Button>
            <Button
              className={(this.state.reason === FLAG_REASON.thumbs_down && 'selected') || ''}
              onClick={() => this.handleReasonChange(FLAG_REASON.thumbs_down)}
            >
              {lang.tr('module.misunderstood.qnaThumbsDown').toUpperCase()}
            </Button>
          </div>
          <Popover usePortal={true} position={'bottom-right'}>
            <Button icon="calendar" className={style.filterItem}>
              {lang.tr('module.misunderstood.dateRange')}
            </Button>
            <DateRangePicker
              onChange={this.handleDateChange.bind(this)}
              allowSingleDayRange={true}
              shortcuts={shortcuts}
              maxDate={date.relativeDates.now}
              value={this.state.dateRange}
            />
          </Popover>
          <SidePanelContent
            eventCounts={eventCounts}
            selectedStatus={selectedStatus}
            events={events}
            selectedEventIndex={selectedEventIndex}
            onSelectedStatusChange={this.setEventsStatus}
            onSelectedEventChange={this.setEventIndex}
            applyAllPending={this.applyAllPending}
            deleteAllStatus={this.deleteAllStatus}
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
