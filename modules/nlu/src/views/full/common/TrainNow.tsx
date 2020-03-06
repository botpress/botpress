import { Button } from '@blueprintjs/core'
import { NLUApi } from 'api'
import React, { FC, useEffect, useState } from 'react'

const TrainNow: FC<{ api: NLUApi }> = ({ api }) => {
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)

  useEffect(() => {
    const fetchIsTraining = async () => {
      setLoading(true)
      const isTraining = await api.isTraining()
      setTraining(isTraining)
      setLoading(false)
    }

    // tslint:disable-next-line: no-floating-promises
    fetchIsTraining()
  }, [])

  const waitForTrainingToEnd = async () => {
    return new Promise(resolve => {
      let startedTraining = false
      const handle = setInterval(async () => {
        const isTraining = await api.isTraining()
        if (isTraining) {
          startedTraining = true
        }
        if (startedTraining && !isTraining) {
          clearInterval(handle)
          resolve()
        }
      }, 500)
    })
  }

  const onClick = async () => {
    if (training) {
      await api.cancelTraining()
      setTraining(false)
    } else {
      setTraining(true)
      // tslint:disable-next-line: no-floating-promises
      api.train()
      await waitForTrainingToEnd()
      setTraining(false)
    }
  }

  return (
    <Button loading={loading} onClick={() => onClick()}>
      {training ? 'Cancel Training' : 'Train now'}
    </Button>
  )
}

export default TrainNow
