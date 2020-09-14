import { Icon } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { FC } from 'react'
import React from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import layout from './Layout.scss'
import WarningMessage from './WarningMessage'

type Props = ReturnType<typeof mapStateToProps>

const NotTrainedWarningComponent: FC<Props> = (props: Props) => {
  const currentStatus = props.currentSession?.status

  const displayWarning = props.emulatorOpen && currentStatus !== 'done'
  if (!displayWarning) {
    return null
  }

  return <WarningMessage message={lang.tr('statusBar.trainWarning')} />
}

const mapStateToProps = (state: RootReducer) => ({
  currentSession: state.nlu.trainSession,
  emulatorOpen: state.ui.emulatorOpen
})
export default connect(mapStateToProps)(NotTrainedWarningComponent)
