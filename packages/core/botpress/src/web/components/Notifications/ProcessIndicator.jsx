import React, { Component } from 'react'
import classnames from 'classnames'

import './ProcessIndicator.css'

import EventBus from '~/util/EventBus'

const defaultState = {
  title: '',
  status: '',
  isComplete: false,
  isStart: false
}

export default class ProcessStatus extends Component {
  constructor(props) {
    super(props)

    this.state = defaultState

    EventBus.default.emit('process-indicator.fetch')

    EventBus.default.on('process-indicator.create', statusInfo => {
      this.setState({
        ...statusInfo,
        isStart: true
      })
    })

    EventBus.default.on('process-indicator.update', statusInfo => {
      this.setState(statusInfo)
    })

    EventBus.default.on('process-indicator.complete', statusInfo => {
      this.setState(
        {
          ...statusInfo,
          isComplete: true
        },
        () => {
          setTimeout(() => {
            this.setState(defaultState)
          }, 3000)
        }
      )
    })
  }

  status() {
    const { status, title, isComplete, isStart } = this.state
    const processCSS = { 'process-indicator_complete': isComplete, 'process-indicator_start': isStart }

    switch (status.toLowerCase()) {
      case 'error':
        return (
          <div className={classnames('process-indicator process-indicator_error', processCSS)}>
            <div className="process-indicator__message">{title}:&nbsp;</div>
            <div className="process-indicator__error">{status}!</div>
          </div>
        )

      case 'success':
        return (
          <div className={classnames('process-indicator process-indicator_success', processCSS)}>
            <div className="process-indicator__message">{title}:&nbsp;</div>
            <div className="process-indicator__success">{status}!</div>
          </div>
        )

      case 'in progress':
        return (
          <div className={classnames('process-indicator process-indicator_in-progress', processCSS)}>
            <div className="process-indicator__message">{title}:&nbsp;</div>
            <div className="lds-ellipsis">
              <div className="lds-ellipsis__point" />
              <div className="lds-ellipsis__point" />
              <div className="lds-ellipsis__point" />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  render() {
    return this.status()
  }
}
