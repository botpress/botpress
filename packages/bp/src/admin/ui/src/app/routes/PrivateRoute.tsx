import NPS from '@kazukinagata/react-nps-typescript'
import React, { FC, useState } from 'react'
import store from '~/app/store'
import { Redirect, Route } from 'react-router-dom'
import { changeDisplayNps, switchWorkspace } from '~/user/reducer'
import BasicAuthentication from '~/auth/basicAuth'
import '@kazukinagata/react-nps-typescript/dist/index.css'
import './npsCustom.css'
import { AppState } from '~/app/rootReducer'
import { connect } from 'react-redux'
import { fetchBotHealth, fetchBotsByWorkspace } from '~/workspace/bots/reducer'
import { withRouter } from 'react-router'

interface Props {
  path: string
  component: any
  auth: BasicAuthentication
  children: React.ReactNode
  changeDisplayNps: any
  displayNps?: boolean
}

const PrivateRoute: FC<Props> = ({ component: Component, auth, changeDisplayNps, displayNps, children, ...rest }) => {
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [npsDismissed, setNpsDismissed] = useState(false)

  const setStorageItem = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
  }

  const onNpsSubmit = async (score) => {
    setNpsScore(score)
    setTimeout(() => changeDisplayNps(false), 1000)

    setStorageItem('bp/nps/tracking/isComplete', true)
    setStorageItem('bp/nps/tracking/score', score)
    // defined when cancelled or score set!
    setStorageItem('bp/nps/tracking/dateComplete', new Date())
    // console.log(`clicked ${score}`)
    // console.log('displayNps: ', displayNps)
  }

  const onNpsDismiss = async () => {
    setNpsDismissed(true)
    setTimeout(() => changeDisplayNps(false), 1000)

    setStorageItem('bp/nps/tracking/hasCancelled', true)
    setStorageItem('bp/nps/tracking/isComplete', true)
    setStorageItem('bp/nps/tracking/dateComplete', new Date())
  }

  console.log('store.displayNps: ', store.getState().user.displayNps)
  console.log('displayNps: ', displayNps)

  return (
    <Route
      {...rest}
      render={props =>
        auth.isAuthenticated() ? (
          <Component {...props} auth={auth}>
            {displayNps && (
              <NPS
                score={npsScore}
                dismissed={npsDismissed}
                onSubmit={(score: number) => onNpsSubmit(score)}
                onDismissed={() => onNpsDismiss()}
              />
            )}
            {children}
          </Component>
        ) : (
          <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        )
      }
    />
  )
}

// export default PrivateRoute



const mapStateToProps = (state: AppState) => ({
  displayNps: state.user.displayNps
})

const connector = connect(mapStateToProps, { changeDisplayNps })

export default connector(PrivateRoute)
