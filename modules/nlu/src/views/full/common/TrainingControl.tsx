import { NLUApi } from 'api'
import React, { FC } from 'react'

import style from './style.scss'
import AutoTrainToggle from './AutoTrainToggle'
import TrainNow from './TrainNow'

const TrainingControl: FC<{ api: NLUApi; eventBus: any }> = ({ api, eventBus }) => {
  return (
    <div className={style.trainingControl}>
      <AutoTrainToggle api={api} />
      <TrainNow api={api} eventBus={eventBus} />
    </div>
  )
}

export default TrainingControl
