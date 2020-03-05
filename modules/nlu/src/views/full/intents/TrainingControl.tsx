import { Button } from '@blueprintjs/core'
import { NLUApi } from 'api'
import React, { FC, useEffect, useState } from 'react'

import TrainNow from './TrainNow'

const TrainingControl: FC<{ api: NLUApi }> = ({ api }) => {
  const [autotrain, setAutotrain] = useState(false)

  useEffect(() => {
    const fetchAutotrain = async () => {
      const isOn = await api.isAutotrainOn()
      setAutotrain(isOn)
    }

    // tslint:disable-next-line: no-floating-promises
    fetchAutotrain()
  }, [])

  const toggleAutotrain = async () => {
    await api.setAutotrain(!autotrain)
    setAutotrain(!autotrain)
  }

  return (
    <div>
      <h6>Training</h6>
      <Button onClick={() => toggleAutotrain()}>{autotrain ? 'Pause autotrain' : 'Resume autotrain'}</Button>
      <TrainNow api={api} />
    </div>
  )
}

export default TrainingControl
