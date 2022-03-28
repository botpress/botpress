import { Collapse, Icon, Tab, Tabs } from '@blueprintjs/core'
import { toast } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import api from '~/app/api'
import { ChannelConfig } from './ChannelConfig'
import { CHANNELS } from './channels'
import style from './style.scss'

interface Props {
  botId: string
  clientId: string
}

export const ClientConfig: FC<Props> = ({ botId, clientId }) => {
  const [config, setConfig] = useState({})
  const [isOpen, setOpen] = useState(false)
  const [currentChannel, setCurrentChannel] = useState(Object.keys(CHANNELS)[0])

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.getSecured().get(`/admin/management/channels/clients/${clientId}`)
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
            <b>{`${botId} `}</b>
            <span className="bp3-text-disabled">{clientId}</span>
          </span>
        </div>
        <Icon icon={isOpen ? 'caret-down' : 'caret-left'} />
      </div>

      <Collapse isOpen={isOpen}>
        <div className={style.item}>
          <Tabs
            animate={true}
            selectedTabId={currentChannel}
            onChange={newChannel => setCurrentChannel(newChannel.toString())}
          >
            {Object.keys(CHANNELS).map(channel => (
              <Tab key={`${clientId}.${channel}`} id={channel} title={channel} />
            ))}
          </Tabs>

          <ChannelConfig
            clientId={clientId}
            botId={botId}
            channelName={currentChannel}
            channelMeta={CHANNELS[currentChannel].v0!}
            config={config}
          />
        </div>
      </Collapse>
    </div>
  )
}
