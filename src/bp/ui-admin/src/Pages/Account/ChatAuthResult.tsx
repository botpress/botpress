import React from 'react'

import { LoginContainer } from '../Layouts/LoginContainer'

const ChatAuthResult = props => {
  const error = props.location.state && props.location.state.error

  if (error) {
    return (
      <LoginContainer title="Authentication failed">
        <p>{error}</p>
      </LoginContainer>
    )
  }

  setTimeout(() => {
    window.close()
  }, 1000)

  return (
    <LoginContainer title="Authentication">
      <p>Successfully authenticated. You can close this window.</p>
    </LoginContainer>
  )
}

export default ChatAuthResult
