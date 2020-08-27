import { Icon } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { FC } from 'react'
import React from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import layout from './Layout.scss'

interface Props {
  currentLanguage: string
  emulatorOpen: boolean
  currentSession: NLU.TrainingSession
}

const NotTrainedWarningComponent: FC<Props> = props => {
  const currentStatus = props.currentSession?.status

  const displayWarning = props.emulatorOpen && currentStatus !== 'done'
  if (!displayWarning) {
    return null
  }

  return (
    <div className={layout['not-trained-warning_container']}>
      <div className={layout['not-trained-warning']}>
        <Icon icon="warning-sign" className={layout['not-trained-warning_icon']} />
        <div className={layout['not-trained-warning_text']}>{lang.tr('statusBar.trainWarning')}</div>
      </div>
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  currentSession: state.nlu.trainSession
})
export default connect(mapStateToProps)(NotTrainedWarningComponent)
