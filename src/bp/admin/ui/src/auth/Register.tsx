import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'

import BasicAuthentication from '~/auth/basicAuth'
import LoginContainer from './LoginContainer'
import { RegisterForm } from './RegisterForm'

type RouterProps = RouteComponentProps<{ workspace: string }, {}, { registerUrl?: string }>
type Props = { auth: BasicAuthentication } & RouterProps

export const Register: FC<Props> = props => {
  const [error, setError] = useState<string>()
  const { registerUrl } = props.location.state

  const registerUser = async (email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      return setError(lang.tr('admin.passwordsDontMatch'))
    }

    try {
      setError(undefined)
      await props.auth.register({ email, password }, registerUrl)
    } catch (err) {
      setError(err.message)
    }
  }

  if (props.auth.isAuthenticated() || !registerUrl) {
    return <Redirect to="/" />
  }

  return (
    <LoginContainer
      title={lang.tr('admin.register')}
      subtitle={lang.tr('admin.createMasterAdminAccount')}
      error={error}
    >
      <RegisterForm onRegister={registerUser} />
    </LoginContainer>
  )
}

export default Register
