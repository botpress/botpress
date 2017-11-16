import React, { Component } from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { authEvents } from '~/util/Auth'
import EventBus from '~/util/EventBus'
import routes from '../Routes'

import {
  fetchLicense,
  fetchUser,
  fetchBotInformation,
  fetchModules,
  fetchRules,
  fetchNotifications,
  replaceNotifications,
  addNotifications
} from '~/actions'

class App extends Component {

  constructor(props) {
    super(props)

    this.state = {
      events: EventBus.default
    }

    if (window.APP_NAME) {
      window.document.title = window.APP_NAME
    }

    EventBus.default.setup()
  }

  fetchData() {
    this.props.fetchModules()
    this.props.fetchNotifications()
    this.props.fetchBotInformation()
    this.props.fetchLicense()
    
    if (window.AUTH_ENABLED) {
      this.props.fetchUser()
      this.props.fetchRules()
    }
  }

  componentDidMount() {
    // This acts as the app lifecycle management.
    // If this grows too much, move to a dedicated lifecycle manager.
    this.fetchData()

    authEvents.on('login', this.fetchData)
    authEvents.on('new_token', this.fetchData)

    EventBus.default.on('notifications.all', (notifications) => {
      this.props.replaceNotifications(notifications)
    })

    EventBus.default.on('notifications.new', (notification) => {
      this.props.addNotifications([notification])
    })

    this.fetchModulesInterval = setInterval(this.props.fetchModules, 10000)
  }

  componentWillUnmount() {
    clearInterval(this.fetchModulesInterval)
  }

  render() {
    return (
      routes()
    )
  }
}

const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      fetchLicense,
      fetchUser,
      fetchBotInformation,
      fetchModules,
      fetchRules,
      fetchNotifications,
      replaceNotifications,
      addNotifications
    },
    dispatch
  )

export default connect(null, mapDispatchToProps)(App)
