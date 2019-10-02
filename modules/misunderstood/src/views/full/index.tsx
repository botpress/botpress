import { AxiosStatic } from 'axios'
import { Container, SidePanel, SplashScreen } from 'botpress/ui'
import React from 'react'

import { FLAGGED_MESSAGE_STATUS } from '../../types'

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

interface MainViewProps {
  bp: {
    axios: AxiosStatic
  }
}

export default class MisunderstoodMainView extends React.Component<MainViewProps> {
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

  constructor(props: MainViewProps) {
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

  setStateP(updater: object | Function) {
    return new Promise(resolve => {
      this.setState(updater, () => {
        resolve()
      })
    })
  }

  setLanguage = async (language: string) => {
    await this.setStateP({ language, eventCounts: null, events: null, selectedEventIndex: null, selectedEvent: null })
    await Promise.all([
      this.setEventsStatus(INITIAL_STATUS),
      (async () => {
        const eventCounts = await this.fetchEventCounts(language)
        await this.setStateP({ eventCounts })
      })()
    ])
  }

  setEventsStatus = async (selectedStatus: string) => {
    await this.setStateP({ selectedStatus, events: null, selectedEventIndex: null, selectedEvent: null })
    const events = await this.fetchEvents(this.state.language, selectedStatus)
    await this.setStateP({ events })
    await this.setEventIndex(0)
  }

  setEventIndex = async (selectedEventIndex: number) => {
    await this.setStateP({ selectedEventIndex, selectedEvent: null })
    const { events } = this.state
    if (events && events.length && selectedEventIndex < events.length) {
      const event = await this.fetchEvent(events[selectedEventIndex].id)
      await this.setStateP({ selectedEvent: event })
    }
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
      <Container>
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
            />
          )}
        </SidePanel>

        {loaded && eventCounts && dataLoaded ? (
          <div className={style.padded}>
            <MainScreen
              selectedEvent={selectedEvent}
              selectedEventIndex={selectedEventIndex}
              totalEventsCount={eventCounts[selectedStatus] || 0}
              selectedStatus={selectedStatus}
              events={events}
            />
          </div>
        ) : (
          <SplashScreen title="Loading..." description="Please wait while we're loading data" />
        )}
      </Container>
    )
  }
}
