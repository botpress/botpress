import { AuthStrategyConfig } from 'common/typings'
import { get } from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'

import api from '../../api'
import BasicAuthentication, { setActiveWorkspace } from '../../Auth'
import { LoginContainer } from '../Layouts/LoginContainer'

import { AuthMethodPicker } from './AuthMethodPicker'
import { LoginForm } from './LoginForm'

type Props = {
  auth: BasicAuthentication
} & RouteComponentProps<{ strategy: string; workspace: string }>

const extractErrorMessage = () => {
  const urlParams = new window.URLSearchParams(window.location.search)
  return urlParams.get('error')
}

const Login: FC<Props> = props => {
  const [isLoading, setLoading] = useState(true)
  const [isFirstUser, setFirstUser] = useState(false)
  const [strategies, setStrategies] = useState<AuthStrategyConfig[]>()
  const [loginUrl, setLoginUrl] = useState('')
  const [error, setError] = useState<string | null>()

  useEffect(() => {
    setError(undefined)
    selectStrategy(props.match.params.strategy)

    if (strategies && strategies.length === 1) {
      updateUrlStrategy(strategies[0].strategyId)
      selectStrategy(strategies[0].strategyId)
    }
  }, [props.match.params.strategy, isLoading])

  useEffect(() => {
    if (!strategies) {
      // tslint:disable-next-line: no-floating-promises
      loadAuthConfig()
    }

    if (props.match.params.workspace) {
      setActiveWorkspace(props.match.params.workspace)
    }

    setError(extractErrorMessage())
  }, [])

  const loadAuthConfig = async () => {
    const { data } = await api.getAnonymous().get('/auth/config')

    setStrategies(data.payload.strategies)
    setFirstUser(data.payload.isFirstUser)
    setLoading(false)
  }

  const updateUrlStrategy = strategyId => props.history.push({ pathname: `/login/${strategyId}` })

  const selectStrategy = (id: string) => {
    const strategy = strategies && strategies.find(x => x.strategyId === id)
    if (!strategy) {
      return setLoginUrl('')
    }
    const { strategyType, strategyId, registerUrl } = strategy

    if (strategyType === 'saml' || strategyType === 'oauth2') {
      return (window.location.href = `${api.getApiPath()}/auth/redirect/${strategyType}/${strategyId}`)
    }

    if (isFirstUser) {
      props.history.push({ pathname: '/register', state: { registerUrl } })
    } else {
      setLoginUrl(strategy.loginUrl!)
    }
  }

  const loginUser = async (email: string, password: string) => {
    try {
      setError(undefined)
      await props.auth.login({ email, password }, loginUrl)
    } catch (err) {
      if (err.type === 'PasswordExpiredError') {
        props.history.push({ pathname: '/changePassword', state: { email, password, loginUrl } })
      } else {
        setError(get(err, 'response.data.message', err.message))
      }
    }
  }

  if (props.auth.isAuthenticated()) {
    return <Redirect to="/" />
  }

  if (isLoading || !strategies) {
    return null
  }

  return (
    <LoginContainer subtitle="Login" error={error} poweredBy={true}>
      {loginUrl ? (
        <LoginForm onLogin={loginUser} />
      ) : (
        <AuthMethodPicker strategies={strategies} onStrategySelected={updateUrlStrategy} />
      )}
    </LoginContainer>
  )
}

export default Login
