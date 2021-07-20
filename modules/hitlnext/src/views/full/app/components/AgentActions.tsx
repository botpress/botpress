import {
  Button,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  PopoverInteractionKind,
  Position
} from '@blueprintjs/core'
import { WorkspaceUserWithAttributes } from 'botpress/sdk'

import React, { FC } from 'react'

interface Props {
  agent: WorkspaceUserWithAttributes
}

const AgentActions: FC<Props> = props => {
  const { agent } = props

  const resetPassword = async () => {
    console.log('reseting password for ', agent.email)
  }
  const remove = async () => {
    console.log('removing ', agent.email)
  }

  return (
    <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.CLICK}>
      <Button id="btn-menu" rightIcon="caret-down" text="Actions" />
      <Menu>
        <MenuItem text="Reset password" icon="key" key="reset" id="btn-resetPassword" onClick={resetPassword} />

        <MenuItem
          text="Delete agent"
          icon="trash"
          key="delete"
          id="btn-deleteUser"
          onClick={remove}
          intent={Intent.DANGER}
        />
      </Menu>
    </Popover>
  )
}

export default AgentActions
