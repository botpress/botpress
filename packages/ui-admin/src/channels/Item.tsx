import { Collapse, ControlGroup, FormGroup, Icon, InputGroup, Label, Tab, Tabs } from '@blueprintjs/core'
import { toast } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import api from '~/app/api'
import { CHANNELS } from './channels'
import style from './style.scss'

interface Props {
  botId: string
  clientId: string
}

export const Item: FC<Props> = props => {
  const [config, setConfig] = useState({})
  const [isOpen, setOpen] = useState(false)
  const [currentChannel, setCurrentChannel] = useState(Object.keys(CHANNELS)[0])

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.getSecured().get(`/admin/management/channels/clients/${props.clientId}`)
        setConfig(data)
      } catch (err) {
        toast.failure(err.message)
      }
    }

    void fetch()
  }, [])

  return (
    <div>
      <div onClick={() => setOpen(!isOpen)} className={style.header}>
        <div>
          <span className={style.title}>
            <b>{`${props.botId} `}</b>
            <span className="bp3-text-disabled">{props.clientId}</span>
          </span>
        </div>
        <Icon icon={isOpen ? 'caret-down' : 'caret-left'} />
      </div>

      <Collapse isOpen={isOpen}>
        <div className={style.item}>
          <Tabs animate={true} onChange={newChannel => setCurrentChannel(newChannel.toString())}>
            {Object.keys(CHANNELS).map(channel => (
              <Tab key={`${props.clientId}.${channel}`} id={channel} title={channel} />
            ))}
          </Tabs>
          <div className={style.channels}>
            <FormGroup className={style.formChannel} inline>
              {CHANNELS[currentChannel]?.v0?.fields.map(field => (
                <ControlGroup key={`${props.clientId}.${field}`} className={style.formChannelInput}>
                  <Label>{field}</Label>
                  <InputGroup id={field} defaultValue={config?.[currentChannel]?.[field]} />
                </ControlGroup>
              ))}
            </FormGroup>
          </div>
        </div>
      </Collapse>
    </div>
  )
}
