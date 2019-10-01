import React, { FC, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'
import BasicAuthentication from '~/Auth'

import { LoginContainer } from '../Layouts/LoginContainer'

import { ChangePasswordForm } from './ChangePasswordForm'

type Props = {
  auth: BasicAuthentication
} & RouteComponentProps

export const ChangePassword: FC<Props> = props => {
  const [error, setError] = useState<string>()
  const { email, password, loginUrl } = props.location.state

  const updatePassword = async (newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      return setError(`Passwords don't match`)
    }

    try {
      setError(undefined)
      await props.auth.login({ email, password, newPassword }, loginUrl)
    } catch (err) {
      setError(err.message)
    }
  }

  const subtitle =
    password === ''
      ? 'This is the first time you run Botpress. Please pick a password.'
      : 'Your password has expired or was temporary. Please set a new password.'

  if (props.auth.isAuthenticated() || !email || !loginUrl) {
    return <Redirect to="/" />
  }

  return (
    <LoginContainer subtitle={subtitle} error={error}>
      <ChangePasswordForm onChangePassword={updatePassword} email={email} />
    </LoginContainer>
  )
}

export default ChangePassword
