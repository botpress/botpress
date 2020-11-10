import { Spinner } from '@blueprintjs/core'
import React, { useEffect, useState } from 'react'

import { AgentType, EscalationType } from '../../../../types'
import style from '../../style.scss'

// Sjhould we use context instead ?
interface Props {
  escalation: EscalationType
  currentAgent: AgentType
}

const WEBCHAT_ID = 'hitl-webchat'
const WRAPPER_ID = `${WEBCHAT_ID}-wrapper`

const LiveChat: React.FC<Props> = ({ escalation, currentAgent }) => {
  const [webchatLoaded, setwebchatLoaded] = useState(false)

  function getWebchatStore() {
    return window[WEBCHAT_ID].webchat_store
  }

  function webchatEventListener(message: MessageEvent) {
    if (message.data.chatId !== WEBCHAT_ID) {
      return
    }
    const store = getWebchatStore()
    if (message.data.name === 'webchatLoaded') {
      store.view.setContainerWidth('100%')
      store.view.setLayoutWidth('100%')
      store.view.showChat()
      setwebchatLoaded(true)
    }
  }

  useEffect(() => {
    const webchatConfig = {
      host: window.location.origin,
      botId: window.BOT_ID,
      userId: currentAgent.id,
      conversationId: escalation.agentThreadId, // parseint ?
      showConversationsButton: false,
      enableReset: false,
      chatId: WEBCHAT_ID,
      hideWidget: true,
      disableAnimations: true,
      exposeStore: true,
      className: style.webchatIframe,
      showPoweredBy: false,
      showUserAvatar: false,
      enableResetSessionShortcut: false,
      enableTranscriptDownload: false
      // stylesheet
      // extrastylesheet
    }
    window.botpressWebChat.init(webchatConfig, `#${WRAPPER_ID}`)
    window.addEventListener('message', webchatEventListener)
    return () => window.removeEventListener('message', webchatEventListener)
    // init webchat and window event listeners
    // return a function that removes event listeners
  }, [])

  useEffect(() => {
    if (!webchatLoaded) {
      return
      // push action in queue ... ? necessary ?
    }

    const store = getWebchatStore()
    store.fetchConversation(escalation.agentThreadId)
    // we might need to change the
    // store.console.log('escalation changed and webchat loaded, set webchat target user and conversationID') // maybe not target
    // TODO set webchat user and conversationId
  }, [escalation])

  return (
    <div id={WRAPPER_ID} className={style.webchatWrapper}>
      {!webchatLoaded && <Spinner />}
    </div>
  )
}

export default LiveChat
