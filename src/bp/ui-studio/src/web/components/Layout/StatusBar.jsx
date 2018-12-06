import style from './StatusBar.styl'
import React from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import { Glyphicon } from 'react-bootstrap'

export default class StatusBar extends React.Component {
  expiryTimeMs = 5000

  state = {
    currentEvent: undefined,
    timeoutRef: undefined
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props !== prevProps) {
      const currentEvent = this.props.statusBarEvent
      let timeoutRef = undefined

      if (currentEvent && !currentEvent.working) {
        timeoutRef = setTimeout(this.expireLastEvent, this.expiryTimeMs)
      } else {
        // We clear the timeout on any new events so we dont accidentally clear the event
        clearTimeout(this.state.timeoutRef)
      }

      this.setState({ currentEvent, timeoutRef })
    }
  }

  expireLastEvent = () => {
    this.setState({ currentEvent: undefined })
  }

  renderNluStatus() {
    const isEventFromNlu = _.get(this.state, 'currentEvent.type') === 'nlu'
    const event = this.state.currentEvent

    if (isEventFromNlu && event.message) {
      return (
        <li className={classNames(style.statusBar__listItem, event.working ? style.statusBar__worker : '')}>
          {!event.working && <Glyphicon glyph="ok" />}
          &nbsp;
          {event.message}
        </li>
      )
    }
  }

  render() {
    return (
      <footer className={style.statusBar}>
        <ul className={style.statusBar__list}>
          <li className={style.statusBar__listItem}>
            Botpress Version:&nbsp;
            {this.props.botpressVersion}
          </li>
          <li className={style.statusBar__listItem}>
            Active Bot:&nbsp;
            {this.props.botName}
          </li>
          {this.renderNluStatus()}
        </ul>
      </footer>
    )
  }
}
