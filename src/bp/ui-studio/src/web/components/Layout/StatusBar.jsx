import style from './StatusBar.styl'
import React, { Fragment } from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import { Dropdown, Glyphicon, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Line } from 'progressbar.js'
import EventBus from '~/util/EventBus'
import { keyMap } from '~/keyboardShortcuts'
import { connect } from 'react-redux'

import { updateDocumentationModal, changeContentLanguage } from '~/actions'

//  implement a current lang provider ?

const COMPLETED_DURATION = 2000

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
        {props.shortcut && <div className={style.shortcut}>{props.shortcut}</div>}
        {props.description}
      </Tooltip>
    }
  >
    <div
      className={classNames(style.clickable, style.item, props.className)}
      {..._.omit(props, ['title', 'description', 'children', 'className'])}
    >
      {props.children}
    </div>
  </OverlayTrigger>
)

class LangSwitcher extends React.Component {
  elems = {}

  componentDidUpdate() {
    const lastIdx = this.props.languages.length - 1
    this.elems[lastIdx].focus()
  }

  componentWillUnmount() {
    this.elems = null
  }

  handleKeyDown = (l, e) => {
    if (e.key == 'Enter') {
      this.props.switchLang(l)
    }
  }

  render() {
    return (
      <Dropdown.Menu pullRight onClose={this.props.onClose} className={style.langSwitherMenu}>
        {this.props.languages.map((l, idx) => (
          <li
            tabIndex="-1"
            ref={el => (this.elems[idx] = el)}
            key={l}
            className={style.langItem}
            onClick={this.props.switchLang.bind(this, l)}
            onKeyDown={this.handleKeyDown.bind(this, l)}
          >
            {l.toUpperCase()}
          </li>
        ))}
      </Dropdown.Menu>
    )
  }
}

class StatusBar extends React.Component {
  clearCompletedStyleTimer = undefined

  state = {
    keepBlueUntil: undefined,
    inProgress: [],
    messages: []
  }

  constructor(props) {
    super(props)
    this.progressContainerRef = React.createRef()

    EventBus.default.on('statusbar.event', this.handleModuleEvent)
  }

  handleModuleEvent = event => {
    if (event.message) {
      const messages = this.state.messages.filter(x => x.type !== event.type)
      const newMessage = { ...event, ts: Date.now() }
      this.setState({ messages: [...messages, newMessage] })
    }

    if (event.name === 'done' || event.working === false) {
      this.setState({ inProgress: _.without(this.state.inProgress, event.type) })
    } else {
      this.setState({ inProgress: [..._.without(this.state.inProgress, event.type), event.type] })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.progressBar && this.progressContainerRef.current) {
      this.initializeProgressBar()
    }

    if (!this.state.inProgress.length) {
      if (prevState.inProgress.length) {
        this.progressBar.animate(1, 300)
        clearTimeout(this.clearCompletedStyleTimer)
        this.clearCompletedStyleTimer = setTimeout(this.cleanupCompleted, COMPLETED_DURATION + 250)
      } else {
        this.progressBar.set(0)
      }
    } else {
      const current = this.progressBar.value()
      this.progressBar.animate(Math.min(current + 0.15, 0.75), 200)
    }
  }

  cleanupCompleted = () => {
    const newMessages = this.state.messages.filter(x => x.ts > Date.now() - COMPLETED_DURATION)
    this.setState({ messages: newMessages })
    if (this.progressBar.value() >= 1) {
      this.progressBar.set(0)
    }
  }

  initializeProgressBar = () => {
    this.progressBar = new Line(this.progressContainerRef.current, {
      cstrokeWidth: 10,
      easing: 'easeInOut',
      duration: 300,
      color: 'var(--c-brand)',
      trailColor: 'var(--c-background--dark-1)',
      trailWidth: 30,
      svgStyle: {
        display: 'inline',
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '30px',
        'z-index': 10
      }
    })

    // Put first in the list
    this.progressContainerRef.current.removeChild(this.progressBar.svg)
    this.progressContainerRef.current.prepend(this.progressBar.svg)
  }

  renderTaskProgress() {
    return this.state.messages.map(msg => (
      <div key={`evt-${msg.type}`} className={classNames(style.right, style.item, { [style.worker]: msg.working })}>
        <Glyphicon glyph={msg.working ? 'hourglass' : 'ok-circle'} />
        {' ' + msg.message}
      </div>
    ))
  }

  switchLang = l => {
    this.props.changeContentLanguage(l)
    this.props.toggleLangSwitcher()
  }

  renderContentLangSwitcher() {
    const languages = _.get(this.props.botInfo, 'languages', [])
    if (languages.length > 1) {
      return (
        <Fragment>
          <ActionItem
            className={style.right}
            title="Content Language"
            description={`Change the bot content language. Currently editing: ${this.props.contentLang.toUpperCase()}`}
            onClick={this.props.toggleLangSwitcher}
          >
            <span>
              <Glyphicon glyph="globe" />
              &nbsp;
              {this.props.contentLang.toUpperCase()}
            </span>
          </ActionItem>
          <Dropdown
            className={style.right}
            pullRight
            dropup={true}
            open={this.props.langSwitcherOpen}
            id="lang-switcher"
          >
            <LangSwitcher
              bsRole="menu"
              languages={languages.filter(l => l != this.props.contentLang)}
              switchLang={this.switchLang}
              onClose={this.props.toggleLangSwitcher}
            />
          </Dropdown>
        </Fragment>
      )
    }
  }

  renderDocHints() {
    if (!this.props.docHints.length) {
      return null
    }

    const onClick = () => this.props.updateDocumentationModal(this.props.docHints[0])

    return (
      <ActionItem
        title="Read Documentation"
        shortcut={keyMap['docs-toggle']}
        description="This screen has documentation available."
        onClick={onClick}
      >
        <Glyphicon glyph="question-sign" style={{ marginRight: '5px' }} />
        Documentation
      </ActionItem>
    )
  }

  render() {
    return (
      <footer ref={this.progressContainerRef} className={style.statusBar}>
        <div className={style.list}>
          <ActionItem
            title="Toggle Emulator"
            shortcut={keyMap['emulator-focus']}
            description="Show/hide the Chat Emulator window"
            onClick={this.props.onToggleEmulator}
            className={classNames({ [style.active]: this.props.isEmulatorOpen }, style.right)}
          >
            <Glyphicon glyph="comment" style={{ marginRight: '5px' }} />
            Emulator
          </ActionItem>
          <div className={style.item}>
            <strong>v{this.props.botpressVersion}</strong>
          </div>
          <ActionItem title="Switch Bot" description="Switch to an other bot. This will leave this interface.">
            <a href="/admin">
              <Glyphicon glyph="retweet" style={{ marginRight: '5px' }} />
              <strong>{this.props.botName}</strong> (bot)
            </a>
          </ActionItem>
          {this.renderDocHints()}
          {this.renderTaskProgress()}
          {this.renderContentLangSwitcher()}
        </div>
      </footer>
    )
  }
}

const mapStateToProps = state => ({
  botInfo: state.bot,
  docHints: state.ui.docHints,
  contentLang: state.language.contentLang
})

export default connect(
  mapStateToProps,
  { updateDocumentationModal, changeContentLanguage }
)(StatusBar)
