import { Button, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { UserProfile } from 'common/typings'
import React, { FC, useState } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

interface Props {
  isOpen: boolean
  profile: UserProfile
  toggle: () => void
}

const UpdatePassword: FC<Props> = props => {
  const [password, setPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  const submit = async event => {
    event.preventDefault()

    const { strategyType, strategy, email } = props.profile

    try {
      await api.getSecured().post(`/auth/login/${strategyType}/${strategy}`, { email, password, newPassword })

      props.toggle()
      toastSuccess('Password updated successfully')
    } catch (err) {
      toastFailure(`Error while updating password: ${err.message}`)
    }
  }

  return (
    <Dialog
      title="Change your password"
      icon="key"
      isOpen={props.isOpen}
      onClose={props.toggle}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="Current password">
            <InputGroup
              id="input-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              tabIndex={1}
              autoFocus={true}
            />
          </FormGroup>

          <FormGroup label="New password">
            <InputGroup
              id="input-newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              tabIndex={2}
            />
          </FormGroup>

          <FormGroup label="Confirm password">
            <InputGroup
              id="input-confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              tabIndex={3}
            />
          </FormGroup>
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-submit"
              type="submit"
              text="Save"
              tabIndex={4}
              intent={Intent.PRIMARY}
              disabled={!password || !newPassword || newPassword !== confirmPassword}
            />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default UpdatePassword
