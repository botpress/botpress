import NPS from '@kazukinagata/react-nps-typescript'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { Redirect, Route } from 'react-router-dom'
import { AppState } from '~/app/rootReducer'
import BasicAuthentication from '~/auth/basicAuth'
import { saveNps } from '~/helpers'
import { Nps } from '~/typings'
import { changeDisplayNps } from '~/user/reducer'
import '@kazukinagata/react-nps-typescript/dist/index.css'
import './npsCustom.scss'

const NPS_KEY = 'bp/nps'

interface Props {
  path: string
  component: any
  auth: BasicAuthentication
  children: React.ReactNode
  changeDisplayNps: (boolean) => void
  displayNps?: boolean
}

const PrivateRoute: FC<Props> = ({ component: Component, auth, changeDisplayNps, displayNps, children, ...rest }) => {
  const nps: Nps = window.BP_STORAGE.get(NPS_KEY) || {} as Nps
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [npsDismissed, setNpsDismissed] = useState(false)

  const onNpsSubmit = async (score) => {
    setNpsScore(score)
    nps.tracking = {
      ...nps.tracking,
      isSet: true,
      score,
      date: new Date().toUTCString()
    }

    saveNps(nps)
    setTimeout(() => changeDisplayNps(false), 1000)
  }

  const onNpsDismiss = async () => {
    setNpsDismissed(true)
    nps.tracking = {
      ...nps.tracking,
      isSet: true,
      isCanceled: true,
      date: new Date().toUTCString()
    }

    saveNps(nps)
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
