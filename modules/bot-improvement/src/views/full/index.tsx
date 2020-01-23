import { Callout } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import { toastFailure } from 'botpress/utils'
import _ from 'lodash'
import React, { useState, useEffect } from 'react'

import '../../../assets/default.css'
import { HitlSessionOverview, Message as HitlMessage } from '../../backend/typings'
import { Attribute } from '../../config'

import { makeApi } from './api'
import Conversation from './components/messages/Conversation'
import Profile from './components/Profile'
import Sidebar from './components/Sidebar'

interface State {
  loading: boolean
  filterPaused: boolean
  sessions: HitlSessionOverview[]
  currentSession: HitlSessionOverview
  filterSearchText: string
  attributesConfig: Attribute[]
}

class HitlModule extends React.Component<{ bp: any }, State> {
  private api = makeApi(this.props.bp)
  private debounceQuerySessions = _.debounce(() => this.querySessions(), 700)

  state: State = {
    loading: false,
    sessions: null,
    currentSession: null,
    filterPaused: false,
    filterSearchText: undefined,
    attributesConfig: undefined
  }

  async componentDidMount() {
    // Loads the extensions module to display dropdown components
    window.botpress.injector.loadModuleView('extensions', true)

    this.props.bp.events.on('hitl.message', this.updateSessionOverview)
    this.props.bp.events.on('hitl.new_session', this.refreshSessions)
    this.props.bp.events.on('hitl.session.changed', this.updateSession)

    await this.fetchAttributesConfig()
    await this.refreshSessions()
  }

  componentWillUnmount() {
    this.props.bp.events.off('hitl.message', this.updateSessionOverview)
    this.props.bp.events.off('hitl.new_session', this.refreshSessions)
    this.props.bp.events.off('hitl.session.changed', this.updateSession)
  }

  async fetchAttributesConfig() {
    this.setState({ attributesConfig: await this.api.getAttributes() })
  }

  refreshSessions = async () => {
    await this.querySessions()

    if (!this.state.currentSession && this.state.sessions) {
      this.switchSession(_.head(this.state.sessions).id)
    }
  }

  updateSession = (changes: any) => {
    if (!this.state.sessions) {
      return
    }

    this.setState({
      sessions: this.state.sessions.map(session => {
        return Object.assign({}, session, session.id === changes.id ? changes : {})
      })
    })

    if (this.state.currentSession) {
      this.switchSession(this.state.currentSession.id)
    }
  }

  updateSessionOverview = (message: HitlMessage) => {
    if (!this.state.sessions) {
      return
    }

    const session: HitlSessionOverview = this.state.sessions.find(x => x.id === message.session_id)
    if (!session) {
      return
    }

    const updatedSessionOverview = Object.assign({}, session, {
      lastMessage: {
        ...message,
        lastEventOn: new Date(),
        lastHeardOn: message.direction === 'in' ? new Date() : session.lastHeardOn
      } as HitlMessage
    })

    this.setState({ sessions: [updatedSessionOverview, ..._.without(this.state.sessions, session)] })
  }

  querySessions = async () => {
    try {
      const sessions = await this.api.findSessions(this.state.filterSearchText, this.state.filterPaused)
      this.setState({ loading: false, sessions })
    } catch (err) {
      toastFailure(err.message)
    }
  }

  toggleFilterPaused = () => this.setState({ filterPaused: !this.state.filterPaused }, this.debounceQuerySessions)
  setFilterSearchText = (filterSearchText: string) => this.setState({ filterSearchText }, this.debounceQuerySessions)

  switchSession = (sessionId: string) =>
    this.setState({ currentSession: this.state.sessions.find(x => x.id === sessionId) })

  // render() {}
}

export default props => {
  console.log(props)

  const api = makeApi(props.bp)

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      const sessions = await api.findSessions(undefined, false)
      setSessions(sessions)
      setLoading(false)
      console.log('done loading sessions')
    }
    fetchSessions()
  }, [])

  if (loading) {
    return <Callout>Loading...</Callout>
  }

  const currentSession = sessions[0]
  console.log(`currentSession:`, currentSession)

  const currentSessionId = currentSession && currentSession.id
  console.log(`currentSessionId:`, currentSessionId)

  return (
    <Container sidePanelWidth={1000}>
      <div>Main content</div>
      {/* <div>
        <h2>Flagged Messages</h2>
        {props.feedbackItems.map((item, i) => {
          return (
            <Feedback
              key={`feedback-${i}`}
              item={item}
              onItemClicked={() => {
                setFeedbackItem(item)
              }}
            />
          )
        })}
      </div> */}

      <div className="bph-layout-main">
        <div className="bph-layout-middle">
          <Conversation
            api={api}
            events={props.bp.events}
            currentSession={currentSession}
            currentSessionId={currentSessionId}
          />
        </div>
        <div className="bph-layout-profile">
          {/* {this.state.currentSession && (
            <Profile
              user={this.state.currentSession.user}
              lastHeardOn={this.state.currentSession.lastHeardOn}
              attributesConfig={this.state.attributesConfig}
            />
          )} */}
        </div>
      </div>
    </Container>
  )
}
