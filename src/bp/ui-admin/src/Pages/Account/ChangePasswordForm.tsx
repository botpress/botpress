import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import React, { FC, useState } from 'react'

interface Props {
  email?: string
  onChangePassword: (newPassword, confirmPassword) => void
}

export const ChangePasswordForm: FC<Props> = props => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const onSubmit = e => {
    e.preventDefault()
    props.onChangePassword(newPassword, confirmPassword)
  }

  return (
    <form onSubmit={onSubmit}>
      {props.email && (
        <FormGroup label="E-mail">
          <InputGroup tabIndex={-1} value={props.email} disabled={true} type="text" id="email" />
        </FormGroup>
      )}

      <FormGroup label="New Password">
        <InputGroup
          tabIndex={1}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          type="password"
          name="newPassword"
          id="newPassword"
          autoFocus={true}
        />
      </FormGroup>

      <FormGroup label="Confirm Password">
        <InputGroup
          tabIndex={2}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          type="password"
          name="confirmPassword"
          id="confirmPassword"
        />
      </FormGroup>

      <Button
        tabIndex={3}
        type="submit"
        text="Change"
        id="btn-change"
        disabled={!newPassword || !confirmPassword}
        intent={Intent.PRIMARY}
      />
    </form>
  )
}
