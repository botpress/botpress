import React from 'react'
import classnames from 'classnames'

import Resizable from 'react-resizable-box'

import WebComponent from './web'

import style from './style.scss'

export const Web = WebComponent

const INJECTION_ID = 'botpress-platform-webchat-injection'
const INJECTION_URL = '/api/botpress-platform-webchat/inject.js'

export class WebBotpressUIInjection extends React.Component {
  componentWillMount() {
    if (document.getElementById(INJECTION_ID)) {
      return
    }

    const script = window.document.createElement('script')
    script.src = INJECTION_URL
    script.id = INJECTION_ID
    script.onload = () =>
      window.botpressWebChat.init({
        hideWidget: true,
        botConvoTitle: 'Bot Emulator',
        botConvoDescription: 'Test your bot live',
        enableReset: true,
        enableTranscriptDownload: true
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
