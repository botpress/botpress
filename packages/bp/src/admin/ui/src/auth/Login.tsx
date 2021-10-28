import { lang } from 'botpress/shared'
import { AuthStrategyConfig } from 'common/typings'
import { get } from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'

import api from '~/app/api'
import { ExtendedHistory } from '~/app/history'
import { AppState } from '~/app/rootReducer'
import BasicAuthentication, { setActiveWorkspace, setChatUserAuth } from '~/auth/basicAuth'

import { changeDisplayNps } from '~/user/reducer'
import { AuthMethodPicker } from './AuthMethodPicker'
import LoginContainer from './LoginContainer'
import { LoginForm } from './LoginForm'

type RouterProps = RouteComponentProps<
  { strategy: string; workspace: string },
  {},
  { registerUrl?: string; from?: string; email?: string; password?: string; loginUrl?: string }
>

interface NpsProps {
  displayNps?: boolean
  changeDisplayNps?: (value: boolean) => void
  // changeDisplayNps: (value: boolean) => void
}

type Props = { auth: BasicAuthentication } & RouterProps & ExtendedHistory & NpsProps

interface AuthConfigResponse {
  payload: {
    strategies: AuthStrategyConfig[]
    isFirstUser: boolean
  }
}

const Login: FC<Props> = props => {
  const [isLoading, setLoading] = useState(true)
  const [isFirstUser, setFirstUser] = useState(false)
  const [strategies, setStrategies] = useState<AuthStrategyConfig[]>()
  const [loginUrl, setLoginUrl] = useState('')
  const [redirectTo, setRedirectTo] = useState<string>()
  const [error, setError] = useState<string | null>()

  useEffect(() => {
    onStrategyChanged()
  }, [props.match.params.strategy, isLoading])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    initialize()
  }, [])

  const initialize = async () => {
    const routeWorkspaceId = props.match.params.workspace
    const { workspaceId, botId, sessionId, signature, error } = props.location.query

    if (routeWorkspaceId || workspaceId) {
      setActiveWorkspace(routeWorkspaceId || workspaceId)
    }

    if (botId && sessionId && signature) {
      setChatUserAuth({ botId, sessionId, signature })
    }

    if (error) {
      setError(error)
    }

    if (props.auth.isAuthenticated()) {
      await props.auth.afterLoginRedirect()
    }

    if (!strategies) {
      await loadAuthConfig()
    }
  }

  const onStrategyChanged = () => {
    selectStrategy(props.match.params.strategy)

    if (strategies && strategies.length === 1) {
      updateUrlStrategy(strategies[0].strategyId)
      selectStrategy(strategies[0].strategyId)
    }

    if (props.location.state) {
      setRedirectTo(props.location.state.from)
    }
  }

  const loadAuthConfig = async () => {
    const { data } = await api.getAnonymous().get<AuthConfigResponse>('/admin/auth/config')

    setStrategies(data.payload.strategies.filter(x => !x.hidden))
    setFirstUser(data.payload.isFirstUser)
    setLoading(false)
  }

  const updateUrlStrategy = (strategyId: string) => props.history.push({ pathname: `/login/${strategyId}` })

  const selectStrategy = (id: string) => {
    const strategy = strategies && strategies.find(x => x.strategyId === id)
    if (!strategy) {
      return setLoginUrl('')
    }

    setError(undefined)

    const { strategyType, strategyId, registerUrl } = strategy

    if (strategyType === 'saml' || strategyType === 'oauth2') {
      return (window.location.href = `${api.getApiPath()}/admin/auth/redirect/${strategyType}/${strategyId}`)
    }

    if (isFirstUser) {
      props.history.push({ pathname: '/register', state: { registerUrl } })
    } else {
      setLoginUrl(strategy.loginUrl!)
    }
  }

  const setStorageItem = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
  }

  const incrementStorageItem = (key: string): number => {
    const currentValue: number = parseInt(localStorage.getItem(key) || '0') + 1
    setStorageItem(key, currentValue)

    return currentValue
  }

  const setupNpsTracking = () => {
    setStorageItem('bp/nps/config/hasSetup', true)
    setStorageItem('bp/nps/config/connections', 5)
    setStorageItem('bp/nps/config/sessionInMinutes', 3)

    setStorageItem('bp/nps/tracking/isComplete', false)
    setStorageItem('bp/nps/tracking/connections', 0)
    setStorageItem('bp/nps/tracking/hasCancelled', false)
    setStorageItem('bp/nps/tracking/score', null)
    // defined when cancelled or score set!
    setStorageItem('bp/nps/tracking/dateComplete', null)
  }

  const shouldDisplayNps = () => {
    const connectionKey = 'bp/nps/tracking/connections'
    const connectionTargetKey = 'bp/nps/config/connections'
    const isCompleteKey = 'bp/nps/tracking/isComplete'

    const connectionTarget: number = parseInt(localStorage.getItem(connectionTargetKey) || '0')
    const isComplete: boolean = JSON.parse(localStorage.getItem(isCompleteKey) || 'false')

    return incrementStorageItem(connectionKey) >= connectionTarget && !isComplete
  }

  const updateNpsTracking = () => {
    if (!localStorage.getItem('bp/nps/config/hasSetup')){
      setupNpsTracking()
    }

    if(shouldDisplayNps()){
      const minutes = parseInt(localStorage.getItem('bp/nps/config/sessionInMinutes') || '0')
      const timeOut = 1000*10

      setTimeout(() => {
        console.log('timeout set!')
        props.changeDisplayNps && props.changeDisplayNps(true)
      }, timeOut)
    }
  }

  const loginUser = async (email: string, password: string) => {
    try {
      setError(undefined)
      await props.auth.login({ email, password }, loginUrl, redirectTo)
      updateNpsTracking()
    } catch (err) {
      if (err.type === 'PasswordExpiredError') {
        props.history.push({ pathname: '/changePassword', state: { email, password, loginUrl } })
      } else {
        setError(get(err, 'response.data.message', err.message))
      }
    }
  }

  if (isLoading || !strategies) {
    return null
  }

  return (
    <LoginContainer title={lang.tr('admin.login')} error={error} poweredBy={true}>
      {loginUrl ? (
        <LoginForm onLogin={loginUser} />
      ) : (
        <AuthMethodPicker strategies={strategies} onStrategySelected={updateUrlStrategy} />
      )}
    </LoginContainer>
  )
}

// export default Login

const mapStateToProps = (state: AppState) => ({
  displayNps: state.user.displayNps
})

const connector = connect(mapStateToProps, { changeDisplayNps })

export default connector(Login)
