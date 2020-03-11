import { Component } from 'react'
import { connect } from 'react-redux'
import {
  addNotifications,
  fetchBotInformation,
  fetchModules,
  fetchNotifications,
  fetchSkills,
  fetchUser,
  handleReceiveFlowsModification,
  refreshHints,
  replaceNotifications
} from '~/actions'
import { authEvents } from '~/util/Auth'
import EventBus from '~/util/EventBus'

import routes, { history } from '../Routes'

interface Props {
  fetchModules: () => void
  fetchSkills: () => void
  refreshHints: () => void
  fetchNotifications: () => void
  fetchBotInformation: () => void
  fetchUser: () => void
  replaceNotifications: (notifications: any) => void
  handleReceiveFlowsModification: (modifications: any) => void
  addNotifications: any
  user: any
}

class App extends Component<Props> {
  fetchData = () => {
    this.props.fetchBotInformation()
    this.props.fetchModules()
    this.props.fetchSkills()
    this.props.fetchUser()
    if (window.IS_BOT_MOUNTED) {
      this.props.refreshHints()
      this.props.fetchNotifications()
    }
  }

  // Prevents re-rendering the whole layout when the user changes. Fixes a bunch of warnings & double queries
  shouldComponentUpdate() {
    return false
  }

  componentDidMount() {
    const appName = window.APP_NAME || 'Botpress Studio'
    const botName = window.BOT_NAME ? ` – ${window.BOT_NAME}` : ''
    window.document.title = `${appName}${botName}`

    EventBus.default.setup()

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
        this.props.handleReceiveFlowsModification(payload)
      }
    })

    EventBus.default.on('hints.updated', () => {
      this.props.refreshHints()
    })

    window.addEventListener('message', e => {
      if (!e.data || !e.data.action) {
        return
      }

      const { action, payload } = e.data
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
  handleReceiveFlowsModification
}

const mapStateToProps = state => ({
  user: state.user
})

export default connect(mapStateToProps, mapDispatchToProps)(App)
