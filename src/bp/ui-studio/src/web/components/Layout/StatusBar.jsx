import style from './StatusBar.styl'
import React from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import { Glyphicon, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Line } from 'progressbar.js'

const titleToId = txt => txt.replace(/[^\W]/gi, '_')

const ActionItem = props => (
  <OverlayTrigger
    placement="top"
    delayShow={500}
    overlay={
      <Tooltip id={titleToId(props.title)}>
        <div>
          <strong>{props.title}</strong>
        </div>
        {props.description}
      </Tooltip>
    }
  >
    <li className={style.statusBar__list__clickable}>{props.children}</li>
  </OverlayTrigger>
)

export default class StatusBar extends React.Component {
  expiryTimeMs = 5000
  timeoutRef = undefined

  state = {
    currentEvent: undefined
  }

  constructor(props) {
    super(props)
    this.progressContainerRef = React.createRef()
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.progressBar && this.progressContainerRef.current) {
      this.initializeProgressBar()
    }

    if (this.props !== prevProps) {
      const currentEvent = this.props.statusBarEvent

      if (prevProps.statusBarEvent && !prevProps.statusBarEvent.working && currentEvent && currentEvent.working) {
        // Started new work
        this.progressBar.set(0)
      } else if (
        prevProps.statusBarEvent &&
        prevProps.statusBarEvent.working &&
        currentEvent &&
        !currentEvent.working
      ) {
        // Was working but now we're done
        this.progressBar.animate(1, 300)
      }

      if (currentEvent && !currentEvent.working) {
        this.timeoutRef = setTimeout(this.expireLastEvent, this.expiryTimeMs)
      } else {
        // We clear the timeout on any new events so the previous timeout dont accidentally clear the new event
        clearTimeout(this.timeoutRef)
      }

      this.setState({ currentEvent })
    }
  }

  expireLastEvent = () => {
    this.setState({ currentEvent: undefined })
    this.progressBar.set(0)
  }

  initializeProgressBar = () => {
    this.progressBar = new Line(this.progressContainerRef.current, {
      cstrokeWidth: 10,
      easing: 'easeInOut',
      duration: 300,
      color: 'var(--c-brand)',
      trailColor: 'var(--c-background--dark-1)',
      trailWidth: 24,
      svgStyle: {
        display: 'inline',
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '24px',
        'z-index': 10
      }
    })

    // Put first in the list
    this.progressContainerRef.current.removeChild(this.progressBar.svg)
    this.progressContainerRef.current.prepend(this.progressBar.svg)
  }

  renderNluStatus() {
    const isEventFromNlu = _.get(this.state, 'currentEvent.type') === 'nlu'
    const event = this.state.currentEvent

    if (isEventFromNlu && event.message) {
      return (
        <li className={classNames(style.statusBar__listItem, event.working ? style.statusBar__worker : '')}>
          <Glyphicon glyph={event.working ? 'hourglass' : 'ok-circle'} />
          {' ' + event.message}
        </li>
      )
    }
  }

  render() {
    return (
      <footer ref={this.progressContainerRef} className={style.statusBar}>
        <ul className={style.statusBar__list}>
          <li>
            <strong>v{this.props.botpressVersion}</strong>
          </li>
          <ActionItem title="Switch Bot" description="Switch to an other bot. This will leave this interface.">
            <a href="/admin">
              <Glyphicon glyph="retweet" style={{ marginRight: '5px' }} />
              <strong>{this.props.botName}</strong> (bot)
            </a>
          </ActionItem>
          {this.renderNluStatus()}
        </ul>
      </footer>
    )
  }
}
