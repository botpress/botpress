import { Component } from 'react'
import nanoid from 'nanoid'
import { connect } from 'react-redux'

import { authEvents } from '~/util/Auth'
import EventBus from '~/util/EventBus'
import routes, { history } from '../Routes'

import {
  fetchUser,
  fetchBotInformation,
  fetchModules,
  fetchSkills,
  refreshHints,
  fetchNotifications,
  replaceNotifications,
  addNotifications,
  appendLog,
  receiveFlowsModification
} from '~/actions'

class App extends Component {
  componentWillMount() {
    const appName = window.APP_NAME || 'Botpress Studio'
    const botName = window.BOT_NAME ? ` – ${window.BOT_NAME}` : ''
    window.document.title = `${appName}${botName}`

    EventBus.default.setup()
  }

  fetchData = () => {
    this.props.fetchModules()
    this.props.fetchSkills()
    this.props.refreshHints()
    this.props.fetchNotifications()
    this.props.fetchBotInformation()
    this.props.fetchUser()
  }

  componentDidMount() {
    // This acts as the app lifecycle management.
    // If this grows too much, move to a dedicated lifecycle manager.
    this.fetchData()

    authEvents.on('login', this.fetchData)
    authEvents.on('new_token', this.fetchData)

    EventBus.default.on('notifications.all', notifications => {
      this.props.replaceNotifications(notifications)
    })

    EventBus.default.on('notifications.new', notification => {
      this.props.addNotifications([notification])
    })

    EventBus.default.on('flow.changes', payload => {
      // TODO: should check if real uniq Id is different. Multiple browser windows can be using the same email. There should be a uniq window Id.
      const isOtherUser = this.props.user.email !== payload.userEmail
      const isSameBot = payload.botId === window.BOT_ID
      if (isOtherUser && isSameBot) {
        this.props.receiveFlowsModification(payload)
      }
    })

    EventBus.default.on('hints.updated', () => {
      this.props.refreshHints()
    })

    window.addEventListener('message', e => {
      const { action, payload } = e.data || {}
      if (action === 'navigate-url') {
        history.push(payload)
      }
    })
  }

  render() {
    return routes()
  }
}

const mapDispatchToProps = {
  fetchUser,
  fetchBotInformation,
  fetchModules,
  fetchSkills,
  refreshHints,
  fetchNotifications,
  replaceNotifications,
  addNotifications,
  appendLog,
  receiveFlowsModification
}

const mapStateToProps = state => ({
  user: state.user
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
