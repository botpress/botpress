import { Icon, Intent, Position, Tooltip } from '@blueprintjs/core'
import { Promise as BbPromise } from 'bluebird'
import { lang } from 'botpress/shared'
import React, { FC, Fragment, useEffect, useState } from 'react'
import api from '~/app/api'

interface Props {
  bot: string
  languages: string[]
}

export const NeedsTrainingWarning: FC<Props> = (props: Props) => {
  const { bot, languages } = props

  const [needsTraining, setNeedsTraining] = useState(false)

  useEffect(() => {
    const axios = api.getSecured({ useV1: true })

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    BbPromise.map(languages, async lang => {
      try {
        const { data } = await axios.get(`bots/${bot}/mod/nlu/training/${lang}`)
        return data.status === 'needs-training'
      } catch (err) {
        return false
      }
    }).then(langNeedsTraining => {
      setNeedsTraining(langNeedsTraining.some(Boolean))
    })
  }, [])

  const message = () => (
    <Fragment>
      <div>{lang.tr('admin.needsTraining')}</div>
      <div>{lang.tr('admin.howToTrain')}</div>
    </Fragment>
  )

  if (needsTraining) {
    return (
      <Tooltip intent={Intent.WARNING} content={message()} position={Position.TOP}>
        <Icon icon="warning-sign" intent={Intent.WARNING} style={{ marginLeft: 10 }} />
      </Tooltip>
    )
  }
  return null
}
