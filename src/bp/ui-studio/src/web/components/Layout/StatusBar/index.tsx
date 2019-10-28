import { Icon } from '@blueprintjs/core'
import axios from 'axios'
import classNames from 'classnames'
import _ from 'lodash'
import { Line } from 'progressbar.js'
import React from 'react'
import { Glyphicon } from 'react-bootstrap'
import { GoMortarBoard } from 'react-icons/go'
import { connect } from 'react-redux'
import { updateDocumentationModal } from '~/actions'
import NotificationHub from '~/components/Notifications/Hub'
import { AccessControl } from '~/components/Shared/Utils'
import { keyMap } from '~/keyboardShortcuts'
import EventBus from '~/util/EventBus'

import ActionItem from './ActionItem'
import BotSwitcher from './BotSwitcher'
import ConfigStatus from './ConfigStatus'
import LangSwitcher from './LangSwitcher'
import NluPerformanceStatus from './NluPerformanceStatus'
import style from './StatusBar.styl'

const COMPLETED_DURATION = 2000

interface Props {
  isEmulatorOpen: boolean
  langSwitcherOpen: boolean
  contentLang: string
  docHints: any
  updateDocumentationModal: any
  botpressVersion: string
  user: any
  onToggleGuidedTour: () => void
  toggleBottomPanel: () => void
  onToggleEmulator: () => void
  toggleLangSwitcher: () => void
}

class StatusBar extends React.Component<Props> {
  private progressContainerRef
  private progressBar: Line
  private clearCompletedStyleTimer

  state = {
    progress: 0,
    messages: [],
    nluSynced: true,
    contexts: []
  }

  constructor(props) {
    super(props)
    this.progressContainerRef = React.createRef()
    EventBus.default.on('statusbar.event', this.handleModuleEvent)
  }

  async componentDidMount() {
    await this.fetchContexts()
  }

  fetchContexts = async () => {
    const { data } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/contexts`)
    this.setState({ contexts: data || [] })
  }

  handleModuleEvent = async event => {
    if (event.message) {
      const messages = this.state.messages.filter(x => x.type !== event.type)
      const newMessage = { ...event, ts: Date.now() }
      this.setState({ messages: [...messages, newMessage] })
    }

    if (event.name === 'train') {
      await this.fetchContexts()
      this.setState({ nluSynced: false })
    } else if (event.name === 'done' || event.working === false) {
      this.setState({ progress: 1 })
    } else {
      if (event.value != this.state.progress) {
        this.setState({ progress: event.value })
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.progressBar && this.progressContainerRef.current) {
      this.initializeProgressBar()
    }

    if (prevState.progress != this.state.progress && this.state.progress) {
      if (this.state.progress >= 1) {
        this.progressBar.animate(1, 300)
        clearTimeout(this.clearCompletedStyleTimer)
        this.clearCompletedStyleTimer = setTimeout(this.cleanupCompleted, COMPLETED_DURATION + 250)
      } else {
        this.progressBar.animate(this.state.progress, 200)
      }
    }
  }

  cleanupCompleted = () => {
    const newMessages = this.state.messages.filter(x => x.ts > Date.now() - COMPLETED_DURATION)
    this.setState({ messages: newMessages })
    this.setState({ progress: 0 })
    this.progressBar.set(0)
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
        className={style.right}
      >
        <Icon icon="help" />
      </ActionItem>
    )
  }

  render() {
    return (
      <footer ref={this.progressContainerRef} className={style.statusBar}>
        <div className={style.list}>
          <ActionItem
            title="Show Emulator"
            id={'statusbar_emulator'}
            shortcut={keyMap['emulator-focus']}
            onClick={this.props.onToggleEmulator}
            className={classNames({ [style.active]: this.props.isEmulatorOpen }, style.right)}
          >
            <Glyphicon glyph="comment" style={{ marginRight: '5px' }} />
            Emulator
          </ActionItem>
          <ActionItem title="Notification" description="View Notifications" className={style.right}>
            <NotificationHub />
          </ActionItem>
          <NluPerformanceStatus
            contentLang={this.props.contentLang}
            updateSyncStatus={syncedStatus => this.setState({ nluSynced: syncedStatus })}
            synced={this.state.nluSynced}
          />
          <AccessControl resource="bot.logs" operation="read">
            <ActionItem
              id="statusbar_logs"
              title="Logs Panel"
              shortcut={keyMap['bottom-bar']}
              description="Toggle Logs Panel"
              className={style.right}
              onClick={this.props.toggleBottomPanel}
            >
              <Icon icon="console" />
            </ActionItem>
          </AccessControl>
          <ActionItem
            onClick={this.props.onToggleGuidedTour}
            title="Toggle Guided Tour"
            description=""
            className={style.right}
          >
            <GoMortarBoard />
          </ActionItem>
          <div className={style.item}>
            <strong>{this.props.botpressVersion}</strong>
          </div>
          <BotSwitcher />
          {this.props.user && this.props.user.isSuperAdmin && <ConfigStatus />}
          {this.renderDocHints()}
          {this.renderTaskProgress()}
          <LangSwitcher
            toggleLangSwitcher={this.props.toggleLangSwitcher}
            langSwitcherOpen={this.props.langSwitcherOpen}
          />
        </div>
      </footer>
    )
  }
}

const mapStateToProps = state => ({
  user: state.user,
  botInfo: state.bot,
  docHints: state.ui.docHints,
  contentLang: state.language.contentLang
})

export default connect(
  mapStateToProps,
  { updateDocumentationModal }
)(StatusBar)
