import { Button, ControlGroup, FormGroup, InputGroup, Label } from '@blueprintjs/core'
import { toast } from 'botpress/shared'
import React, { FC } from 'react'
import api from '~/app/api'
import { ChannelVersionMeta } from './channels'
import style from './style.scss'
import { WebhookEntry } from './WebhookEntry'

interface Props {
  clientId: string
  botId: string
  channelName: string
  channelMeta: ChannelVersionMeta
  config: any
}

export const ChannelConfig: FC<Props> = ({ clientId, botId, channelName, channelMeta, config }) => {
  const postConfig = async () => {
    try {
      await api.getSecured().post(`/admin/management/channels/clients/${clientId}`, config)
      toast.success('Channel config updated')
    } catch (err) {
      toast.failure(err.message)
    }
  }

  const updateValue = async (field: string, value: string) => {
    if (value.length === 0) {
      delete config[channelName]

      if (config[channelName] && Object.keys(config[channelName]).length === 0) {
        delete config[channelName]
      }
    } else {
      if (!config[channelName]) {
        config[channelName] = {}
      }

      config[channelName][field] = value
    }
  }

  return (
    <div className={style.channels}>
      <FormGroup className={style.formChannel} inline>
        {(channelMeta.webhooks || [undefined]).map(webhook => (
          <WebhookEntry
            key={`${clientId}.${webhook}`}
            clientId={clientId}
            botId={botId}
            channel={channelName}
            webhook={webhook}
          />
        ))}
        {channelMeta.fields.map(field => (
          <ControlGroup key={`${clientId}.${field}`} className={style.formChannelInput}>
            <Label>{field}</Label>
            <InputGroup
              id={field}
              defaultValue={config[channelName]?.[field]}
              onChange={x => updateValue(field, x.target.value.trim())}
            />
          </ControlGroup>
        ))}
      </FormGroup>

      <Button onClick={postConfig} className="bp3-intent-primary" id="btn-save" text={'Save'} />
    </div>
  )
}
