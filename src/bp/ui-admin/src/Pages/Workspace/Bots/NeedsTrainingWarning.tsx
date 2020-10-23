import { Classes, Icon, Intent, Position } from '@blueprintjs/core'
import { Promise as BbPromise } from 'bluebird'
import { ToolTip } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import api from '~/api'

interface Props {
  bot: string
  languages: string[]
}

export const NeedsTrainingWarning: FC<Props> = (props: Props) => {

  const { bot, languages } = props

  const [needsTraining, setNeedsTraining] = useState(false)

  useEffect(() => {
    const axios = api.getSecured()

    // tslint:disable-next-line: no-floating-promises
    BbPromise.map(languages, async lang => {
      try {
        const { data } = await axios.get(`bots/${bot}/mod/nlu/training/${lang}`)
        return data.status === 'needs-training'
      } catch (err) {
        return false
      }
    }).then((langNeedsTraining) => {
      setNeedsTraining(langNeedsTraining.some(Boolean))
    })

  }, [])

  if (needsTraining) {
    return (
      <ToolTip content="Needs training..." className={Classes.TOOLTIP_INDICATOR} position={Position.TOP} intent={Intent.DANGER}>
        <Icon icon="warning-sign" intent={Intent.DANGER} style={{ marginLeft: 10 }} />
      </ToolTip>
      )
  }
  return null
}
