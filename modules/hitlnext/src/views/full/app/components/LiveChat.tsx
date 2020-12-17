import { Spinner } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { useEffect, useState } from 'react'

import { IAgent, IHandoff } from '../../../../types'
import style from '../../style.scss'

interface Props {
  handoff: IHandoff
  currentAgent: IAgent
}

const WEBCHAT_ID = 'hitl-webchat'
const WRAPPER_ID = `${WEBCHAT_ID}-wrapper`

const LiveChat: React.FC<Props> = ({ handoff, currentAgent }) => {
  const [webchatReady, setWebchatReady] = useState(false)

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
    } else if (message.data.name === 'webchatReady') {
      setWebchatReady(true)
    }
  }

  useEffect(() => {
    const webchatConfig = {
      host: window.location.origin,
      botId: window.BOT_ID,
      userId: currentAgent.agentId,
      conversationId: handoff.agentThreadId, // parseint ?
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
      enableTranscriptDownload: false,
      enableConversationDeletion: false,
      closeOnEscape: false,
      composerPlaceholder: lang.tr('module.hitlnext.conversation.composerPlaceholder'),
      stylesheet: 'assets/modules/hitlnext/webchat-theme.css'
    }
    window.botpressWebChat.init(webchatConfig, `#${WRAPPER_ID}`)
    window.addEventListener('message', webchatEventListener)
    return () => window.removeEventListener('message', webchatEventListener)
  }, [])

  useEffect(() => {
    if (!webchatReady) {
      return
    }
    const store = getWebchatStore()
    store.fetchConversation(handoff.agentThreadId)
  }, [handoff])

  return (
    <div id={WRAPPER_ID} className={style.webchatWrapper}>
      {!webchatReady && <Spinner />}
    </div>
  )
}

export default LiveChat
