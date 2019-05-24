import React from 'react'

import Message from '../lite/components/messages/Message'
import * as Keyboard from '../lite/components/Keyboard'

const INJECTION_ID = 'bp-channel-web-injection'
const INJECTION_URL = `/assets/modules/channel-web/inject.js`

export class WebBotpressUIInjection extends React.Component {
  componentDidMount() {
    if (document.getElementById(INJECTION_ID)) {
      return
    }

    const script = window.document.createElement('script')
    script.src = INJECTION_URL
    script.id = INJECTION_ID
    script.onload = () =>
      window.botpressWebChat.init({
        hideWidget: true,
        botName: 'Bot Emulator',
        botConvoDescription: 'Test your bot live',
        enableReset: true,
        enableTranscriptDownload: true,
        botId: window.BOT_ID,
        sendUsageStats: window.SEND_USAGE_STATS,
        disableAnimations: true,
        overrides: {
          before_container: {
            module: 'extensions',
            component: 'DevTools'
          }
        }
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

export {
  Carousel,
  QuickReplies,
  LoginPrompt,
  Text,
  FileMessage,
  FileInput,
  Button
} from '../lite/components/messages/renderer'
export { Message, Keyboard }
