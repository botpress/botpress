import React, { FC } from 'react'

import { AgentType } from './../../../types'

import { Popover, Position, Menu, MenuItem, Button, Icon } from '@blueprintjs/core'
import { lang } from 'botpress/shared'

import AgentIcon from './AgentIcon'

type Props = {
  toggleOnline: (online) => {}
  loading: boolean
} & Partial<AgentType>

const AgentProfile: FC<Props> = props => {
  return (
    <Popover
      content={
        <Menu>
          {props.online ? (
            <MenuItem
              onClick={() => props.toggleOnline(false)}
              text={lang.tr('module.hitl2.agent.getOffline')}
            ></MenuItem>
          ) : (
            <MenuItem
              onClick={() => props.toggleOnline(true)}
              text={lang.tr('module.hitl2.agent.getOnline')}
            ></MenuItem>
          )}
        </Menu>
      }
      position={Position.BOTTOM_RIGHT}
    >
      <Button loading={props.loading} minimal={true} style={{ position: 'relative' }}>
        <AgentIcon online={props.online} />
        <span style={{ paddingLeft: 10 }}>
          {props?.online ? lang.tr('module.hitl2.agent.online') : lang.tr('module.hitl2.agent.offline')}
        </span>
        <Icon icon="caret-down"></Icon>
      </Button>
    </Popover>
  )
}

export default AgentProfile
