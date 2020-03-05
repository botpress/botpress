import { ControlGroup } from '@blueprintjs/core'
import { NLUApi } from 'api'
import React, { FC } from 'react'

import style from './style.scss'
import AutotrainToggle from './AutotrainToggle'
import TrainNow from './TrainNow'

const TrainingControl: FC<{ api: NLUApi }> = ({ api }) => {
  return (
    <div className={style.trainingControl}>
      <AutotrainToggle api={api} />
      <TrainNow api={api} />
    </div>
  )
}

export default TrainingControl
