import * as sdk from 'botpress/sdk'
import classnames from 'classnames'
import React from 'react'

import { updater } from '.'
import style from './style.scss'

const DELAY_BETWEEN_CALLS = 500

export class Wrapper extends React.Component<WrapperProps> {
  allowedRetryCount = 6
  currentRetryCount = 0

  handleMessageClicked = () => {
    updater.callback(this.props.messageId, true)
  }

  async componentDidMount() {
    if (!['session_reset', 'visit'].includes(this.props.type)) {
      await this.loadEvent(this.props.messageId)
    }
  }

  loadEvent = async (messageId: string) => {
    if (!messageId) {
      return
    }

    let keepRetrying = false
    this.setState({ fetching: true })

    try {
      const event = await this.getEvent(messageId)
    } catch (err) {
      keepRetrying = true
    }

    if (keepRetrying) {
      if (this.currentRetryCount < this.allowedRetryCount) {
        this.currentRetryCount++

        await Promise.delay(DELAY_BETWEEN_CALLS)
        await this.loadEvent(messageId)
      } else {
        this.currentRetryCount = 0
        this.setState({ fetching: false })
      }
    } else {
      this.setState({ fetching: false })
      this.currentRetryCount = 0
    }
  }

  getEvent = async (messageId: string): Promise<sdk.IO.IncomingEvent> => {
    const { data: event } = await this.props.bp.axios.get(`/mod/extensions/message-to-event/${messageId}`)
    return event
  }

  render() {
    return (
      <div className={style.hovering} onClick={this.handleMessageClicked}>
        {this.props.children}
      </div>
    )
  }
}

interface WrapperProps {
  type: string
  messageId: string
  store: any
  bp: any
}
