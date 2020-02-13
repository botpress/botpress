import React, { FC, useState } from 'react'

import { HitlApi } from '../api'

interface Props {
  api: HitlApi
  currentSessionId: string
}

const Composer: FC<Props> = props => {
  const [message, setMessage] = useState('')

  const handleKeyPress = async event => {
    if (event.key === 'Enter' && message.trim().length > 0) {
      event.preventDefault()

      if (event.shiftKey) {
        return setMessage(message + '\n')
      }

      await props.api.sendMessage(props.currentSessionId, message.trim())
      setMessage('')
    }
  }

  return (
    <div className="bph-composer">
      <textarea
        value={message}
        placeholder="Type your message...."
        onChange={event => setMessage(event.target.value)}
        onKeyPress={handleKeyPress}
      />
    </div>
  )
}

export default Composer
