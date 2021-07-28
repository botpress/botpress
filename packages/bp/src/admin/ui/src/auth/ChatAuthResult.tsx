import { lang } from 'botpress/shared'
import React, { FC } from 'react'
import { RouteComponentProps } from 'react-router'

import LoginContainer from './LoginContainer'

type Props = RouteComponentProps<undefined, {}, { error?: string }>

const ChatAuthResult: FC<Props> = props => {
  const error = props.location.state && props.location.state.error

  if (error) {
    return (
      <LoginContainer title={lang.tr('admin.authenticationFailed')}>
        <p>{error}</p>
      </LoginContainer>
    )
  }

  setTimeout(() => {
    window.close()
  }, 1000)

  return (
    <LoginContainer title="Authentication">
      <p>{lang.tr('admin.successfullyAuthenticated')}</p>
    </LoginContainer>
  )
}

export default ChatAuthResult
