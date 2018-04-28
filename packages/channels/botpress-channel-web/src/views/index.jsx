import React from 'react'
import classnames from 'classnames'

import Resizable from 'react-resizable-box'

import WebComponent from './web'

import style from './style.scss'

export class Emulator extends React.Component {
  // Deprecated

  constructor(props) {
    super()
    this.session = new ChatSession({ events: props.bp.events })
    this.resizable = null
    this.state = {
      collapsed: false
    }
  }

  toggleCollapsed = () => {
    if (!this.state.collapsed) {
      const originalHeight = this.resizable.state.height
      const originalWidth = this.resizable.state.width
      this.resizable.updateSize({ height: 40 })
      this.setState({ originalHeight, originalWidth, collapsed: true })
    } else {
      this.resizable.updateSize({ height: this.state.originalHeight, width: this.state.originalWidth })
      this.setState({ collapsed: false })
    }
  }

  startNewSession = event => {
    event.preventDefault()
    event.stopPropagation()

    this.session.startNewSession()
  }

  componentDidMount() {
    const className = classnames(style.chatComponent, 'bp-modules-chat')

    const chatComponent = <Chat showWelcome={true} className={className} session={this.session} />

    this.setState({ chatComponent })
  }

  render() {
    const minHeight = this.state.collapsed ? 40 : 400
    const maxheight = this.state.collapsed ? 40 : 1000

    const emulatorStyle = classnames(style.emulator, {
      [style.hidden]: this.state.collapsed
    })

    return (
      <div className={emulatorStyle}>
        <Resizable
          ref={c => {
            this.resizable = c
          }}
          width={300}
          height={400}
          minWidth={300}
          minHeight={minHeight}
          maxHeight={maxheight}
          enable={{
            top: true,
            right: true,
            topLeft: true,
            left: true,
            topRight: true,
            bottom: false, // Disable bottom because sticks in bottom left corner
            bottomRight: false,
            bottomLeft: false
          }}
        >
          <div className={style.header} onClick={this.toggleCollapsed}>
            <div className={style.left}>Emulator</div>
            <div className={style.right}>
              <span className={style.button} onClick={this.startNewSession}>
                <i className="icon material-icons">refresh</i>
              </span>
            </div>
          </div>
          {this.state.chatComponent}
        </Resizable>
      </div>
    )
  }
}

export const Web = WebComponent

const INJECTION_ID = 'botpress-platform-webchat-injection'
const INJECTION_URL = '/api/botpress-platform-webchat/inject.js'

export class WebBotpressUIInjection extends React.Component {
  componentWillMount() {
    if (document.getElementById(INJECTION_ID)) return

    const script = window.document.createElement('script')
    script.src = INJECTION_URL
    script.id = INJECTION_ID
    script.onload = () =>
      window.botpressWebChat.init({
        hideWidget: true,
        botConvoTitle: 'Bot Emulator',
        botConvoDescription: 'Test your bot live',
        enableReset: true
      })

    window.document.body.appendChild(script)

    const button = document.createElement('li')
    Object.assign(button, {
      role: 'presentation',
      onclick: () => window.botpressWebChat.sendEvent({ type: 'show' }),
      innerHTML: `
        <a role="button" href="#">
          <span class="bp-full-screen">
            <span class="glyphicon glyphicon-comment"></span>
          </span>
        </a>
      `
    })

    const target = document.querySelector('.bp-navbar-module-buttons') || document.querySelector('.nav.navbar-nav')
    target.appendChild(button)
  }

  render() {
    return null
  }
}
