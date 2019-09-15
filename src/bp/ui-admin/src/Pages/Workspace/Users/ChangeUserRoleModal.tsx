import { Button, Classes, Dialog, Intent } from '@blueprintjs/core'
import { WorkspaceUser } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import Select from 'react-select'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

interface Props {
  isOpen: boolean
  toggle: () => void
  onUserUpdated?: () => void
  roles: any
  user: WorkspaceUser | null
}

const ChangeUserRoleModal: FC<Props> = props => {
  const [role, setRole] = useState<any | null>(null)

  useEffect(() => {
    if (props.user && props.roles) {
      setRole(roleOptions().find(x => x.value === props.user!.role))
    }
  }, [props.user])

  if (!props.user) {
    return null
  }

  const updateRole = async () => {
    try {
      await api.getSecured().put(`/admin/users/workspace/update_role`, {
        ...props.user,
        role: role.value
      })

      toastSuccess(`Role updated successfully`)
      props.onUserUpdated && props.onUserUpdated()
    } catch (err) {
      toastFailure(`Could not update role: ${err.message}`)
    }
  }

  const roleOptions = () => props.roles.map(x => ({ value: x.id, label: x.name }))
  const isRoleDifferent = role && role.value === props.user.role

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.toggle}
      transitionDuration={0}
      title={<span>Editing role of {props.user.email}</span>}
    >
      <div className={Classes.DIALOG_BODY}>
        <Select
          autoFocus={true}
          id="select-role"
          tabIndex="3"
          options={roleOptions()}
          value={role}
          onChange={role => setRole(role)}
        />
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            id="btn-save"
            tabIndex={3}
            type="submit"
            text="Save"
            onClick={updateRole}
            disabled={isRoleDifferent}
            intent={Intent.PRIMARY}
          />
        </div>
      </div>
    </Dialog>
  )
}

export default ChangeUserRoleModal
