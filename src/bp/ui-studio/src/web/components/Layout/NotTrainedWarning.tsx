import { Icon } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { FC, useEffect, useState } from 'react'
import React from 'react'

import TrainingStatusObserver from './training-status-observer'
import layout from './Layout.scss'

interface Props {
  currentLanguage: string
  emulatorOpen: boolean
}

export const NotTrainedWarningComponent: FC<Props> = props => {
  const [currentStatus, setCurrentStatus] = useState(null as NLU.TrainingStatus)

  useEffect(() => {
    const listener = {
      name: 'NotTrainedWarningComponent',
      cb: updateState,
      error: () => {}
    }
    TrainingStatusObserver.addListener(listener)

    // tslint:disable-next-line: no-floating-promises
    TrainingStatusObserver.fetchTrainingStatus()

    return () => {
      TrainingStatusObserver.removeListener(listener)
    }
  }, [])

  const updateState = (session: NLU.TrainingSession, _fromWS: boolean) => {
    setCurrentStatus(session.status)
  }

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
