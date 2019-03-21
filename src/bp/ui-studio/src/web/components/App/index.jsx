import { Component } from 'react'

import { connect } from 'react-redux'

import { authEvents } from '~/util/Auth'
import EventBus from '~/util/EventBus'
import routes from '../Routes'

import {
  fetchUser,
  fetchBotInformation,
  fetchModules,
  fetchSkills,
  fetchNotifications,
  replaceNotifications,
  addNotifications
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
  fetchNotifications,
  replaceNotifications,
  addNotifications
}

export default connect(
  null,
  mapDispatchToProps
)(App)
