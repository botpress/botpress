import NPS from '@kazukinagata/react-nps-typescript'
import React, { FC, useState } from 'react'
import { Redirect, Route } from 'react-router-dom'
import BasicAuthentication from '~/auth/basicAuth'
import '@kazukinagata/react-nps-typescript/dist/index.css'
import './npsCustom.css'

interface Props {
  path: string
  component: any
  auth: BasicAuthentication
  children: React.ReactNode
}

const PrivateRoute: FC<Props> = ({ component: Component, auth, children, ...rest }) => {
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [npsDismissed, setNpsDismissed] = useState(false)

  const onNpsSubmit = ({ score }) => {
    console.log(`clicked ${score}`)
    setNpsScore(score)
  }

  const setStorageItem = (key: string, value: any) =>{
    localStorage.setItem(key, JSON.stringify(value))
  }

  const isNpsConfigured = localStorage.getItem('bp/nps/config/isSet')

  if (!isNpsConfigured){
    // setStorageItem('bp/nps/config/isSet', false)
    // setStorageItem('bp/nps/config/isComplete', false)
    // setStorageItem('bp/nps/config/connections', 5)
    // setStorageItem('bp/nps/config/sessionInMinutes', 3)
    //
    // setStorageItem('bp/nps/tracking/connections', 0)
    // setStorageItem('bp/nps/tracking/hasCancelled', false)
    // setStorageItem('bp/nps/tracking/score', null)
  }

  setTimeout(() => console.log('3000'), 2000)

  console.log('reloaded!', auth.isAuthenticated())

  return (
    <Route
      {...rest}
      render={props =>
        auth.isAuthenticated() ? (
          <Component {...props} auth={auth}>
            <NPS
              score={npsScore}
              dismissed={npsDismissed}
              onSubmit={(score: number) => onNpsSubmit({score})}
              onDismissed={() => setNpsDismissed(true)}
            />
            {children}
          </Component>
        ) : (
          <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        )
      }
    />
  )
}

export default PrivateRoute
