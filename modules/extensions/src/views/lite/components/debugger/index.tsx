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

  handleNewMessage = async ({ payload, incomingEventId }) => {
    if (!['session_reset', 'visit'].includes(payload.type) && incomingEventId !== this.lastMessage) {
      this.lastMessage = incomingEventId
      this.loadEvent(incomingEventId)
    }
  }

  handleSelect = async (_actionId: string, props: any) => {
    this.loadEvent(props.incomingEventId, true)
  }

  loadEvent = (eventId: string, isManual?: boolean) => {
    this.props.store.view.setHighlightedMessages(eventId)
    window.parent.postMessage({ action: 'load-event', payload: { eventId, isManual } }, '*')
  }

  render() {
    return null
  }
}
