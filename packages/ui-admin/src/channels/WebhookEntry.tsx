import { ControlGroup, Label } from '@blueprintjs/core'
import { toast } from 'botpress/shared'
import React, { FC } from 'react'
import style from './style.scss'

interface Props {
  clientId: string
  botId: string
  channel: string
  webhook: string
}

export const WebhookEntry: FC<Props> = ({ clientId, botId, channel, webhook }: Props) => {
  const url = `${window.EXTERNAL_URL}/api/v1/messaging/webhooks/${botId}/${channel}${webhook ? `/${webhook}` : ''}`

  return (
    <ControlGroup className={style.formChannelInput}>
      <Label>webhook{webhook ? ` (${webhook})` : ''}</Label>
      <div>
        <a
          onClick={e => {
            e.preventDefault()
            return navigator.clipboard.writeText(url).then(() => {
              return toast.success('The URL has been copied to your clipboard!')
            })
          }}
        >
          {url}
        </a>
      </div>
    </ControlGroup>
  )
}
