import { NLUApi } from 'api'
import React, { FC } from 'react'

import AutotrainToggle from './AutotrainToggle'
import TrainNow from './TrainNow'

const TrainingControl: FC<{ api: NLUApi }> = ({ api }) => {
  return (
    <div>
      <h6>Training</h6>
      <AutotrainToggle api={api} />
      <TrainNow api={api} />
    </div>
  )
}

export default TrainingControl
