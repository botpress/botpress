import { Button } from '@blueprintjs/core'
import { NLUApi } from 'api'
import React, { FC, useState } from 'react'

const TrainNow: FC<{ api: NLUApi }> = ({ api }) => {
  const [training, setTraining] = useState(false)

  const train = async () => {
    setTraining(true)
    await api.train()
    setTraining(false)
  }
  return (
    <Button onClick={() => train()} disabled={training}>
      Train now
    </Button>
  )
}

export default TrainNow
