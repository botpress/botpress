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
import style from './StatusBar.styl'

interface Props {
  isEmulatorOpen: boolean
  langSwitcherOpen: boolean
  contentLang: string
  docHints: any
  updateDocumentationModal: any
  user: any
  botInfo: any
  onToggleGuidedTour: () => void
  toggleBottomPanel: () => void
  onToggleEmulator: () => void
  toggleLangSwitcher: () => void
}

const DEFAULT_STATE = {
  progress: 0,
  working: false,
  message: ''
}

class StatusBar extends React.Component<Props> {
  pbRef: HTMLElement
  progressBar: Line
  state = { ...DEFAULT_STATE }

  componentDidMount() {
    EventBus.default.on('statusbar.event', this.handleModuleEvent)
    this.initializeProgressBar()
    this.fetchTrainingSession()
  }

  componentDidUpdate(pp, prevState) {
    if (this.state.working) {
      this.progressBar.animate(this.state.progress, 200)
    } else {
      if (this.state.progress < 1) {
        // canceled
        this.progressBar.set(0)
      } else {
        // done
        this.resetStateTimeOut()
      }
    }
  }

  resetStateTimeOut = () => {
    setTimeout(() => this.setState({ ...DEFAULT_STATE }), 2000)
  }

  shouldUpdateNLUEvent = (event): boolean => {
    return (
      event.type === 'nlu' &&
      event.botId === window.BOT_ID &&
      _.get(event, 'trainSession.language') === this.props.contentLang
    )
  }

  handleModuleEvent = async event => {
    if (this.shouldUpdateNLUEvent(event)) {
      this.setState({ message: event.message, working: event.working, progress: event.trainSession.progress })
    } else if (event.working && event.value && this.state.progress !== event.value) {
      this.updateProgress(event.value) // @deprecated remove when engine 1 is totally gone
    }
    if (event.message && this.state.message !== event.message) {
      this.setState({ message: event.message, working: event.working })
    }
  }

  updateProgress(progress: number) {
    this.setState({ progress })
  }

  fetchTrainingSession = () => {
    // tslint:disable-next-line: no-floating-promises
    axios.get(`${window.BOT_API_PATH}/mod/nlu/training/${this.props.contentLang}`).then(({ data: session }) => {
      if (session && session.status === 'training') {
        this.setState({
          working: true,
          progress: session.progress,
          message: 'Training'
        })
        this.updateProgress(session.progress)
      }
    })
  }

  initializeProgressBar = () => {
    this.progressBar = new Line(this.pbRef, {
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

    this.pbRef.prepend(this.progressBar.svg)
  }

  renderTaskMessage() {
    return (
      <div className={classNames(style.right, style.item, { [style.worker]: this.state.working })}>
        <Glyphicon glyph={this.state.working ? 'hourglass' : 'ok-circle'} />
        &nbsp; {this.state.message}
      </div>
    )
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
      <footer ref={el => (this.pbRef = el)} className={style.statusBar}>
        <div className={style.list}>
          {window.IS_BOT_MOUNTED && (
            <React.Fragment>
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
            </React.Fragment>
          )}
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
          {window.IS_BOT_MOUNTED && (
            <ActionItem
              onClick={this.props.onToggleGuidedTour}
              title="Toggle Guided Tour"
              description=""
              className={style.right}
            >
              <GoMortarBoard />
            </ActionItem>
          )}
          <div className={style.item}>
            <strong>{window.BOTPRESS_VERSION}</strong>
          </div>
          <BotSwitcher />
          {this.props.user && this.props.user.isSuperAdmin && <ConfigStatus />}
          {this.renderDocHints()}
          {this.renderTaskMessage()}
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

export default connect(mapStateToProps, { updateDocumentationModal })(StatusBar)
