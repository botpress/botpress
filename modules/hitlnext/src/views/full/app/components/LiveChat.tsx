import { Spinner } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { useEffect, useState } from 'react'

import { MODULE_NAME } from '../../../../constants'
import { IAgent, IHandoff } from '../../../../types'
import style from '../../style.scss'

interface Props {
  handoff: IHandoff
  currentAgent: IAgent
}

const INJECTION_ID = 'bp-channel-web-injection'
const INJECTION_URL = 'assets/modules/channel-web/inject.js'
const WEBCHAT_ID = 'hitl-webchat'
const WRAPPER_ID = `${WEBCHAT_ID}-wrapper`
let intervalId: ReturnType<typeof setInterval>

const LiveChat: React.FC<Props> = ({ handoff, currentAgent }) => {
  const [webchatLoaded, setWebchatLoaded] = useState(false)
  const [webchatReady, setWebchatReady] = useState(false)

  const loadWebchat = () => {
    // Ensure the webchat is only added once to the page
    if (document.getElementById(INJECTION_ID)) {
      setWebchatLoaded(true)
      return
    }

    const script = window.document.createElement('script')
    script.src = INJECTION_URL
    script.id = INJECTION_ID
    window.document.body.appendChild(script)

    intervalId = setInterval(() => {
      // Once added, the webchat takes some time before being ready to initialize
      if (window.botpressWebChat) {
        setWebchatLoaded(true)
        clearInterval(intervalId)
      }
    }, 500)
  }

  const webchatEventListener = (message: MessageEvent) => {
    if (message.data.chatId !== WEBCHAT_ID) {
      return
    }

    if (message.data.name === 'webchatLoaded') {
      window.botpressWebChat.sendEvent({ type: 'show' }, WEBCHAT_ID)
    } else if (message.data.name === 'webchatReady') {
      setWebchatReady(true)
    }
  }

  useEffect(() => {
    loadWebchat()

    window.addEventListener('message', webchatEventListener)
    return () => window.removeEventListener('message', webchatEventListener)
  }, [])

  useEffect(() => {
    if (!webchatLoaded) {
      return
    }

    const webchatConfig = {
      host: window.ROOT_PATH,
      botId: window.BOT_ID,
      userId: currentAgent.agentId,
      userIdScope: 'hitlnext',
      conversationId: handoff.agentThreadId,
      showConversationsButton: false,
      enableReset: false,
      chatId: WEBCHAT_ID,
      hideWidget: true,
      disableAnimations: true,
      className: style.webchatIframe,
      showPoweredBy: false,
      showUserAvatar: false,
      enableResetSessionShortcut: false,
      enableTranscriptDownload: false,
      enableConversationDeletion: false,
      closeOnEscape: false,
      containerWidth: '100%',
      layoutWidth: '100%',
      composerPlaceholder: lang.tr('module.hitlnext.conversation.composerPlaceholder'),
      stylesheet: 'assets/modules/hitlnext/webchat-theme.css',
      overrides: {
        composer: [
          {
            module: MODULE_NAME,
            component: 'HITLComposer'
          }
        ]
      }
    }

    window.botpressWebChat.init(webchatConfig, `#${WRAPPER_ID}`)
  }, [webchatLoaded])

  useEffect(() => {
    if (!webchatReady) {
      return
    }

    window.botpressWebChat.sendEvent({ type: 'loadConversation', conversationId: handoff.agentThreadId }, WEBCHAT_ID)
  }, [handoff])

  return (
    <div id={WRAPPER_ID} className={style.webchatWrapper}>
      {!webchatReady && <Spinner />}
    </div>
  )
}

export default LiveChat
