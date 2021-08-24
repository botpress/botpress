import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'

import BasicAuthentication from '~/auth/basicAuth'
import { ChangePasswordForm } from './ChangePasswordForm'
import LoginContainer from './LoginContainer'

type RouterProps = RouteComponentProps<undefined, {}, { email: string; password: string; loginUrl: string }>
type Props = { auth: BasicAuthentication } & RouterProps

export const ChangePassword: FC<Props> = props => {
  const [error, setError] = useState<string>()
  const { email, password, loginUrl } = props.location.state

  const updatePassword = async (newPassword: string, confirmPassword: string) => {
    if (newPassword !== confirmPassword) {
      return setError(lang.tr('admin.passwordsDontMatch'))
    }

    try {
      setError(undefined)
      await props.auth.login({ email, password, newPassword }, loginUrl)
    } catch (err) {
      setError(err.message)
    }
  }

  const subtitle = password === '' ? lang.tr('admin.firstTimeYouRun') : lang.tr('admin.setANewPassword')

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
