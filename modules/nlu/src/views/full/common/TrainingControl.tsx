import { NLUApi } from 'api'
import React, { FC } from 'react'

import style from './style.scss'
import AutoTrainToggle from './AutoTrainToggle'
import TrainNow from './TrainNow'

const TrainingControl: FC<{ api: NLUApi }> = ({ api }) => {
  return (
    <div className={style.trainingControl}>
      <AutoTrainToggle api={api} />
      <TrainNow api={api} />
    </div>
  )
}

export default TrainingControl
