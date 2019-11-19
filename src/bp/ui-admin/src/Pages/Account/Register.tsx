import React, { FC, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'
import BasicAuthentication from '~/Auth'

import { LoginContainer } from '../Layouts/LoginContainer'

import { RegisterForm } from './RegisterForm'

type Props = {
  auth: BasicAuthentication
} & RouteComponentProps<{ workspace: string }>

export const Register: FC<Props> = props => {
  const [error, setError] = useState<string>()
  const { registerUrl } = props.location.state

  const registerUser = async (email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      return setError(`Passwords don't match`)
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
      title="Register"
      subtitle="This is the first time you run Botpress. Please create the master admin account."
      error={error}
    >
      <RegisterForm onRegister={registerUser} />
    </LoginContainer>
  )
}

export default Register
