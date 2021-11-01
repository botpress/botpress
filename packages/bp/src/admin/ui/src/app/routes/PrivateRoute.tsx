import NPS from '@kazukinagata/react-nps-typescript'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { Redirect, Route } from 'react-router-dom'
import { AppState } from '~/app/rootReducer'
import BasicAuthentication from '~/auth/basicAuth'
import { changeDisplayNps } from '~/user/reducer'
import '@kazukinagata/react-nps-typescript/dist/index.css'
import './npsCustom.scss'

interface Props {
  path: string
  component: any
  auth: BasicAuthentication
  children: React.ReactNode
  changeDisplayNps: (boolean) => void
  displayNps?: boolean
}

interface NpsConfig {
  minConnections: number
  minSessionDuration: number
  isSet: boolean
}

interface NpsTracking {
  connections: number
  isCanceled: boolean
  isSet: boolean
  score: number
  date: string
}

interface Nps {
  config: NpsConfig
  tracking: NpsTracking
}

const NPS_KEY = 'bp/nps'

const PrivateRoute: FC<Props> = ({ component: Component, auth, changeDisplayNps, displayNps, children, ...rest }) => {
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [npsDismissed, setNpsDismissed] = useState(false)

  const updateNpsTracking = (value: Partial<NpsTracking>) => {
    const nps: Nps = window.BP_STORAGE.get(NPS_KEY) || {} as Nps

    console.log('before', nps)

    if (!nps){
      return
    }

    nps.tracking = {
      ...nps.tracking,
      ...value,
      date: new Date().toUTCString()
    }

    window.BP_STORAGE.set(NPS_KEY, nps)

    console.log(window.BP_STORAGE.get(NPS_KEY))
  }

  const onNpsSubmit = async (score) => {
    setNpsScore(score)
    updateNpsTracking({ isSet: true, score })

    setTimeout(() => changeDisplayNps(false), 1000)
  }

  const onNpsDismiss = async () => {
    setNpsDismissed(true)
    updateNpsTracking({ isCanceled: true, isSet: true })

    setTimeout(() => changeDisplayNps(false), 1000)
  }

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

const mapStateToProps = (state: AppState) => ({
  displayNps: state.user.displayNps
})

const connector = connect(mapStateToProps, { changeDisplayNps })

export default connector(PrivateRoute)
