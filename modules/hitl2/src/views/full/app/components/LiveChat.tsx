import React, { useEffect, useState } from 'react'

import { AgentType, EscalationType } from '../../../../types'

// Sjhould we use context instead ?
interface Props {
  escalation: EscalationType
  currentAgent: AgentType
}

const WEBCHAT_ID = 'hitl-webchat'

const LiveChat: React.FC<Props> = ({ escalation, currentAgent }) => {
  const [webchatLoaded, setwebchatLoaded] = useState(false)

  function webchatEventListener(message: MessageEvent) {
    if (message.data.chatId !== WEBCHAT_ID) {
      return
    }
    if (message.data.name === 'webchatLoaded') {
      // TODO use store instead
      // @ts-ignore
      window.botpressWebChat.sendEvent({ type: 'show' }, WEBCHAT_ID)
      setwebchatLoaded(true)
    } else {
      console.log(message)
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
      exposeStore: true
      // containerWidth: 700, get current width ?
      // layoutWidth: 700, get current width ?
      // className: 'chat2',
      // stylesheet
      // extrastylesheet
    }
    window.botpressWebChat.init(webchatConfig, `#${WEBCHAT_ID}`)
    window.addEventListener('message', webchatEventListener)
    return () => window.removeEventListener('message', webchatEventListener)
    // init webchat and window event listeners
    // return a function that removes event listeners
  }, [])

  useEffect(() => {
    if (!webchatLoaded) {
      return
      // push action in queue ... ?
    }
    console.log('escalation changed and webchat loaded, set webchat target user and conversationID') // maybe not target
    // TODO set webchat user and conversationId
  }, [escalation])
  return (
    <div id={WEBCHAT_ID}>
      {!webchatLoaded && <div>loading</div>}
      <div>live convo is displayed here conversation id to render is {escalation.agentThreadId}</div>
    </div>
  )
}

export default LiveChat
