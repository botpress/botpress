import { lang } from 'botpress/shared'
import React from 'react'

import { LoginContainer } from '../Layouts/LoginContainer'

const ChatAuthResult = props => {
  const error = props.location.state && props.location.state.error

  if (error) {
    return (
      <LoginContainer title={lang.tr('authenticationFailed')}>
        <p>{error}</p>
      </LoginContainer>
    )
  }

  setTimeout(() => {
    window.close()
  }, 1000)

  return (
    <LoginContainer title="Authentication">
      <p>{lang.tr('successfullyAuthenticated')}</p>
    </LoginContainer>
  )
}

export default ChatAuthResult
