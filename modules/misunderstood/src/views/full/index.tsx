import {
  Container,
  InfoTooltip,
  Item,
  ItemList,
  KeyboardShortcut,
  SearchBar,
  SectionAction,
  SidePanel,
  SidePanelSection,
  SplashScreen
} from 'botpress/ui'
import React from 'react'

import SidePanelContent from './SidePanel'

const getDefaultLanguage = (languages: string[]) => {
  if (languages.includes('en')) {
    return 'en'
  }
  return languages[0]
}

const INITIAL_STATUS = 'new'

export default class MisunderstoodMainView extends React.Component<{ bp: { axios: any } }> {
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

  fetchEventCounts(language: string) {
    return this.props.bp.axios
      .get('/mod/misunderstood/events/count', {
        params: {
          language
        }
      })
      .then(res => res.data)
  }

  fetchEvents(language: string, status: string) {
    return this.props.bp.axios
      .get(`/mod/misunderstood/events/${status}`, {
        params: {
          language
        }
      })
      .then(res => res.data)
  }

  fetchEvent(id: string) {
    return this.props.bp.axios.get(`/mod/misunderstood/events/${id}`).then(res => res.data)
  }

  async componentDidMount() {
    const languages = await this.props.bp.axios.get('/').then(res => res.data.languages)

    this.setState(
      {
        languages,
        loaded: true
      },
      () => {
        const language = getDefaultLanguage(languages)
        this.setLanguage(language)
      }
    )
  }

  setLanguage = (language: string) => {
    this.setState(
      { language, eventCounts: null, events: null, selectedEventIndex: null, selectedEvent: null },
      async () => {
        this.setEventsStatus(INITIAL_STATUS)

        const eventCounts = await this.fetchEventCounts(language)
        this.setState({ eventCounts })
      }
    )
  }

  setEventsStatus = (selectedStatus: string) => {
    this.setState({ selectedStatus, events: null, selectedEventIndex: null, selectedEvent: null }, async () => {
      const events = await this.fetchEvents(this.state.language, selectedStatus)
      this.setState({ events }, () => {
        this.setEventIndex(0)
      })
    })
  }

  setEventIndex = selectedEventIndex => {
    this.setState({ selectedEventIndex, selectedEvent: null }, async () => {
      const { events } = this.state
      if (events && events.length && selectedEventIndex < events.length) {
        const event = await this.fetchEvent(events[selectedEventIndex].id)
        this.setState({ selectedEvent: event })
      }
    })
  }

  render() {
    const { loaded, languages, language, eventCounts, selectedStatus, events, selectedEventIndex } = this.state

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

        {loaded ? (
          <div>Your module stuff here</div>
        ) : (
          <SplashScreen title="Loading..." description="Please wait while we're loading data" />
        )}
      </Container>
    )
  }
}
