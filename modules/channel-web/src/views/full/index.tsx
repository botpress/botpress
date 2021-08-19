import React from 'react'

import * as Keyboard from '../lite/components/Keyboard'
import Message from '../lite/components/messages/Message'

const INJECTION_ID = 'bp-channel-web-injection'
const INJECTION_URL = 'assets/modules/channel-web/inject.js'
const EMULATOR_WIDTH = 300

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
        isEmulator: true,
        botName: 'Bot Emulator',
        botConvoDescription: 'Test your bot live',
        enableReset: true,
        enableTranscriptDownload: true,
        botId: window.BOT_ID,
        userIdScope: 'studio',
        sendUsageStats: window.SEND_USAGE_STATS,
        disableAnimations: true,
        useSessionStorage: false,
        showPoweredBy: false,
        enableResetSessionShortcut: true,
        enableConversationDeletion: true,
        containerWidth: EMULATOR_WIDTH,
        layoutWidth: EMULATOR_WIDTH
      })

    window.document.body.appendChild(script)
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
