import { Button } from '@blueprintjs/core'
import { NLUApi } from 'api'
import React, { FC, useEffect, useState } from 'react'

import style from './style.scss'

const AutotrainToggle: FC<{ api: NLUApi }> = ({ api }) => {
  const [autotrain, setAutotrain] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAutotrain = async () => {
      setLoading(true)
      const isOn = await api.isAutotrainOn()
      setAutotrain(isOn)
      setLoading(false)
    }

    // tslint:disable-next-line: no-floating-promises
    fetchAutotrain()
  }, [])

  const toggleAutotrain = async () => {
    await api.setAutotrain(!autotrain)
    setAutotrain(!autotrain)
  }

  return (
    <Button
      disabled={loading}
      loading={loading}
      className={style.autotrainToggle}
      icon={autotrain ? 'pause' : 'play'}
      onClick={() => toggleAutotrain()}
    >
      Autotrain
    </Button>
  )
}

export default AutotrainToggle
