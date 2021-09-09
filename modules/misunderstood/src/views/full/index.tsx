import { Button, Popover } from '@blueprintjs/core'
import { DateRange, DateRangePicker } from '@blueprintjs/datetime'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'
import { AxiosStatic } from 'axios'
import { date, lang, ModuleUI } from 'botpress/shared'
import classnames from 'classnames'
import React from 'react'

import { DbFlaggedEvent, FLAGGED_MESSAGE_STATUS, FLAG_REASON, ResolutionData } from '../../types'

import ApiClient from './ApiClient'
import { groupEventsByUtterance } from './eventUtils'
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
  checkedEventIds: number[]
  selectAllChecked: boolean
  selectedEventIndex: number | null
  selectedEvent: DbFlaggedEvent | null
  eventNotFound: boolean
  dateRange?: DateRange
  reason?: FLAG_REASON
}

const shortcuts = date.createDateRangeShortcuts()
const { Container, SidePanel, SplashScreen } = ModuleUI

export default class MisunderstoodMainView extends React.Component<Props, State> {
  state: State = {
    languages: null,
    language: null,
    eventCounts: null,
    selectedStatus: FLAGGED_MESSAGE_STATUS.new,
    events: null,
    selectedEventIndex: null,
    selectedEvent: null,
    checkedEventIds: [],
    selectAllChecked: false,
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
    const events = await this.fetchEvents(this.state.language, selectedStatus, null, this.state.reason)
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
      const currentEvent = this.state.events[selectedEventIndex]
      const events = groupEventsByUtterance(this.state.events).get(currentEvent.preview)
      return this.setEventIndex(selectedEventIndex + events.length)
    }
  }

  async alterEventsList(oldStatus: FLAGGED_MESSAGE_STATUS, newStatus: FLAGGED_MESSAGE_STATUS, eventIds: number[]) {
    // do some local state patching to prevent unneeded content flash
    const { eventCounts, selectedEventIndex, events } = this.state
    const newEventCounts = {
      ...eventCounts,
      [oldStatus]: eventCounts[oldStatus] - eventIds.length,
      [newStatus]: (eventCounts[newStatus] || 0) + eventIds.length
    }
    await this.setStateP({
      eventCounts: newEventCounts,
      selectedEvent: null,
      events: events.filter(event => !eventIds.includes(event.id))
    })

    // advance to the next event
    await this.setEventIndex(selectedEventIndex)

    // update the real events counts from the back-end
    await this.updateEventsCounts()
  }

  deleteCurrentEvents = async () => {
    let eventIds
    if (this.state.checkedEventIds.length > 0) {
      eventIds = [...this.state.checkedEventIds]
      await this.setStateP({ checkedEventIds: [], selectAllChecked: false })
    } else {
      const event = this.state.events[this.state.selectedEventIndex]
      const eventsByUtterance = groupEventsByUtterance(this.state.events)
      const eventsWithIndices = eventsByUtterance.get(event.preview)
      eventIds = eventsWithIndices.map(({ event, eventIndex }) => event.id)
    }

    await this.apiClient.updateStatuses(eventIds, FLAGGED_MESSAGE_STATUS.deleted)

    return this.alterEventsList(FLAGGED_MESSAGE_STATUS.new, FLAGGED_MESSAGE_STATUS.deleted, eventIds)
  }

  undeleteEvent = async (id: number) => {
    await this.apiClient.updateStatuses([id], FLAGGED_MESSAGE_STATUS.new)
    return this.alterEventsList(FLAGGED_MESSAGE_STATUS.deleted, FLAGGED_MESSAGE_STATUS.new, [id])
  }

  resetPendingEvent = async (id: number) => {
    await this.apiClient.updateStatuses([id], FLAGGED_MESSAGE_STATUS.new)
    return this.alterEventsList(FLAGGED_MESSAGE_STATUS.pending, FLAGGED_MESSAGE_STATUS.new, [id])
  }

  amendCurrentEvents = async (resolutionData: ResolutionData) => {
    const event = this.state.events[this.state.selectedEventIndex]

    const eventsByUtterance = groupEventsByUtterance(this.state.events)
    const eventsWithIndices = eventsByUtterance.get(event.preview)

    await this.apiClient.updateStatuses(
      eventsWithIndices.map(({ event, eventIndex }) => event.id),
      FLAGGED_MESSAGE_STATUS.pending,
      resolutionData
    )
    return this.alterEventsList(
      FLAGGED_MESSAGE_STATUS.new,
      FLAGGED_MESSAGE_STATUS.pending,
      eventsWithIndices.map(({ event: { id } }) => id)
    )
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
      eventCounts,
      checkedEventIds: [],
      selectAllChecked: false
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

  onEventCheckedOrUnchecked = async eventIds => {
    let checkedEventIds = [...this.state.checkedEventIds]
    const remove = checkedEventIds.filter(id => eventIds.includes(id)).length > 0
    if (remove) {
      checkedEventIds = checkedEventIds.filter(id => !eventIds.includes(id))
    } else {
      checkedEventIds = [...checkedEventIds, ...eventIds]
    }
    const newState = {
      checkedEventIds
    }
    if (remove) {
      newState['selectAllChecked'] = false
    }
    await this.setStateP(newState)
  }

  onSelectAllChanged = async () => {
    const selectAllChecked = !this.state.selectAllChecked

    await this.setStateP({
      selectAllChecked,
      checkedEventIds: selectAllChecked ? this.state.events.map(e => e.id) : []
    })
  }

  render() {
    const {
      eventCounts,
      selectedStatus,
      events,
      checkedEventIds,
      selectedEventIndex,
      selectedEvent,
      eventNotFound,
      selectAllChecked
    } = this.state

    const { contentLang } = this.props

    const dataLoaded =
      selectedStatus === FLAGGED_MESSAGE_STATUS.new ? selectedEvent || (events && events.length === 0) : events

    const groups = groupEventsByUtterance(events || [])
    const selectedUtterances = new Set()
    groups.forEach(function(eventWithIndex, utterance) {
      for (const {
        event: { id }
      } of eventWithIndex) {
        if (checkedEventIds.includes(id)) {
          selectedUtterances.add(utterance)
        }
      }
    })
    const manyEventsSelected = selectedUtterances.size >= 2

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
            checkedEventIds={checkedEventIds}
            selectedEventIndex={selectedEventIndex}
            onSelectedStatusChange={this.setEventsStatus}
            onSelectedEventChange={this.setEventIndex}
            onEventCheckedOrUnchecked={this.onEventCheckedOrUnchecked}
            applyAllPending={this.applyAllPending}
            deleteAllStatus={this.deleteAllStatus}
            selectAllChecked={selectAllChecked}
            onSelectAllChanged={this.onSelectAllChanged}
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
              deleteEvent={this.deleteCurrentEvents}
              undeleteEvent={this.undeleteEvent}
              resetPendingEvent={this.resetPendingEvent}
              amendEvent={this.amendCurrentEvents}
              applyAllPending={this.applyAllPending}
              manyEventsSelected={manyEventsSelected}
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
