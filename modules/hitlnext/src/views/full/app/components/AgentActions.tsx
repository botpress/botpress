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
import { AxiosInstance } from 'axios'
import { confirmDialog } from 'botpress/shared'
import React, { FC } from 'react'

interface Props {
  agent: WorkspaceUserWithAttributes
  onPasswordReset: (email, newPassword) => void
  bp: { axios: AxiosInstance; events: any }
}

const AgentActions: FC<Props> = props => {
  const { agent, bp } = props

  const resetPassword = async () => {
    const { data } = await bp.axios.post(`/mod/hitlnext/agent/${agent.email}/reset`)
    props.onPasswordReset(agent.email, data.payload.tempPassword)
  }
  const remove = async () => {
    await bp.axios.post(`/mod/hitlnext/agent/${agent.email}/delete`)
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
