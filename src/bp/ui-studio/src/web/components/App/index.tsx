import axios from 'axios'
import { StoredToken } from 'common/typings'
import ms from 'ms'
import { Component } from 'react'
import { connect } from 'react-redux'
import {
  addNotifications,
  fetchBotInformation,
  fetchModules,
  fetchNotifications,
  fetchSkills,
  fetchUser,
  getModuleTranslations,
  handleReceiveFlowsModification,
  refreshHints,
  replaceNotifications
} from '~/actions'
import { authEvents, getToken, REFRESH_INTERVAL, setToken, tokenNeedsRefresh } from '~/util/Auth'
import EventBus from '~/util/EventBus'

import routes, { history } from '../Routes'

interface Props {
  fetchModules: () => void
  fetchSkills: () => void
  refreshHints: () => void
  fetchNotifications: () => void
  fetchBotInformation: () => void
  getModuleTranslations: () => void
  fetchUser: () => void
  replaceNotifications: (notifications: any) => void
  handleReceiveFlowsModification: (modifications: any) => void
  addNotifications: any
  user: any
}

class App extends Component<Props> {
  private interval

  fetchData = () => {
    this.props.getModuleTranslations()
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

    if (window.APP_FAVICON) {
      const link = document.querySelector('link[rel="icon"]')
      link.setAttribute('href', window.APP_FAVICON)
    }

    if (window.APP_CUSTOM_CSS) {
      const sheet = document.createElement('link')
      sheet.rel = 'stylesheet'
      sheet.href = window.APP_CUSTOM_CSS
      sheet.type = 'text/css'
      document.head.appendChild(sheet)
    }

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

    this.interval = setInterval(async () => {
      await this.tryRefreshToken()
    }, REFRESH_INTERVAL)
  }

  async tryRefreshToken() {
    try {
      if (!tokenNeedsRefresh()) {
        return
      }

      const tokenData = getToken(false) as StoredToken

      const { data } = await axios.get(`${window.API_PATH}/auth/refresh`)
      const { newToken } = data.payload

      if (newToken !== tokenData.token) {
        setToken(newToken)
        console.info('Token refreshed successfully')
      } else {
        clearInterval(this.interval)
      }
    } catch (err) {
      console.error('Error validating & refreshing token', err)
    }
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
  handleReceiveFlowsModification,
  getModuleTranslations
}

const mapStateToProps = state => ({
  user: state.user
})

export default connect(mapStateToProps, mapDispatchToProps)(App)
