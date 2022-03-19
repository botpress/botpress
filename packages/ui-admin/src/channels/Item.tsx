import { Collapse, ControlGroup, FormGroup, Icon, InputGroup, Label, Tab, Tabs } from '@blueprintjs/core'
import React, { FC, useState } from 'react'
import { CHANNELS } from './channels'
import style from './style.scss'

interface Props {
  botId: string
  clientId: string
}

export const Item: FC<Props> = props => {
  const [isOpen, setOpen] = useState(false)
  const [currentChannel, setCurrentChannel] = useState(Object.keys(CHANNELS)[0])

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
              <Tab id={channel} title={channel} />
            ))}
          </Tabs>
          <div className={style.channels}>
            <FormGroup className={style.formChannel} inline>
              {CHANNELS[currentChannel]?.v0?.fields.map(field => (
                <ControlGroup className={style.formChannelInput}>
                  <Label>{field}</Label>
                  <InputGroup id={field} />
                </ControlGroup>
              ))}
            </FormGroup>
          </div>
        </div>
      </Collapse>
    </div>
  )
}
