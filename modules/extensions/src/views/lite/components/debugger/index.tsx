import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React from 'react'

export const updater = { callback: undefined }

interface Props {
  store: any
}

interface State {
  event: sdk.IO.IncomingEvent
  selectedTabId: string
  visible: boolean
  showSettings: boolean
  showEventNotFound: boolean
  fetching: boolean
  maximized: boolean
  unauthorized: boolean
  eventsCache: sdk.IO.IncomingEvent[]
  updateDiagram: boolean
}

export class Debugger extends React.Component<Props, State> {
  lastMessage = undefined
  readonly customActionId = 'actionDebug'

  async componentDidMount() {
    updater.callback = this.loadEvent

    this.props.store.setMessageWrapper({ module: 'extensions', component: 'Wrapper' })

    this.props.store.view.addCustomAction({
      id: this.customActionId,
      label: 'Inspect in Debugger',
      onClick: this.handleSelect
    })

    this.props.store.bp.events.on('guest.webchat.message', this.handleNewMessage)

    window.addEventListener('message', e => {
      if (!e.data || !e.data.action) {
        return
      }

      const { action, payload } = e.data
      if (action === 'change-user-id') {
        this.props.store.setUserId(payload)
      }
    })
  }

  componentWillUnmount() {
    this.props.store.bp.events.off('guest.webchat.message', this.handleNewMessage)

    this.props.store.view.removeCustomAction(this.customActionId)
  }

  handleNewMessage = async ({ payload, id }) => {
    if (!['session_reset', 'visit'].includes(payload.type) && id !== this.lastMessage) {
      this.lastMessage = id
      await this.loadEvent(id)
    }
  }

  handleSelect = async (_actionId: string, props: any) => {
    await this.loadEvent(props.id, true)
  }

  loadEvent = async (messageId: string, isManual?: boolean) => {
    try {
      const { data: messages } = await this.props.store.api.axios.get(
        `/mod/extensions/list-by-incoming-event/${messageId}`,
        {
          baseUrl: window['BOT_API_PATH']
        }
      )

      this.props.store.view.setHighlightedMessages(messages)
      window.parent.postMessage({ action: 'load-event', payload: { messageId, isManual } }, '*')
    } catch {}
  }

  render() {
    return null
  }
}
