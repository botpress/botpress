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
import { AxiosInstance } from 'axios'
import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { confirmDialog, toast } from 'botpress/shared'
import React, { FC } from 'react'

interface Props {
  agent: WorkspaceUserWithAttributes
  onPasswordReset: (email, newPassword) => void
  onAgentRemoved: () => void
  bp: { axios: AxiosInstance; events: any }
}

const AgentActions: FC<Props> = props => {
  const { agent, bp } = props

  const resetPassword = async () => {
    if (
      !(await confirmDialog(`Are you sure you want to reset the password for agent ${agent.email}`, {
        acceptLabel: 'Reset'
      }))
    ) {
      return
    }
    try {
      const { data } = await bp.axios.post(`/mod/hitlnext/agent/${agent.email}/reset`)
      props.onPasswordReset(agent.email, data.payload.tempPassword)
    } catch (error) {
      toast.failure(`Could not reset password for agent ${agent.email}`)
    }
  }
  const remove = async () => {
    if (
      !(await confirmDialog(`Are you sure you want to remove agent ${agent.email}`, {
        acceptLabel: 'Remove'
      }))
    ) {
      return
    }
    try {
      await bp.axios.post(`/mod/hitlnext/agent/${agent.email}/delete`)
      toast.success(`Agent ${agent.email} was sucessfully deleted`)
      props.onAgentRemoved()
    } catch (error) {
      toast.failure(`Could not delete agent ${agent.email}`)
    }
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
