import React from 'react'

import { EscalationType } from '../../../../types'

interface Props {
  escalation: EscalationType
}

const LiveChat: React.FC<Props> = ({ escalation }) => (
  <div id="the-web-chat">
    <div>live convo is displayed here conversation id to render is {escalation.agentThreadId}</div>
  </div>
)

export default LiveChat
