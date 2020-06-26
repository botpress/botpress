import { NLUApi } from 'api'
import React, { FC } from 'react'

import style from './style.scss'
import AutoTrainToggle, { AutoTrainObserver } from './AutoTrainToggle'
import TrainNow from './TrainNow'

const autoTrainObserver: AutoTrainObserver = { listeners: [] }

const TrainingControl: FC<{ api: NLUApi; eventBus: any }> = ({ api, eventBus }) => {
  return (
    <div className={style.trainingControl}>
      <AutoTrainToggle api={api} observer={autoTrainObserver} />
      <TrainNow api={api} eventBus={eventBus} observer={autoTrainObserver} />
    </div>
  )
}

export default TrainingControl
