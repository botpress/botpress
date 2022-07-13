import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'
import { PasswordStrengthMeter } from './PasswordStrengthMeter/PasswordStrengthMeter'

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
        <FormGroup label={lang.tr('email')}>
          <InputGroup tabIndex={-1} value={props.email} disabled={true} type="text" id="email-change-password" />
        </FormGroup>
      )}

      <FormGroup label={lang.tr('admin.newPassword')}>
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

      <FormGroup label={lang.tr('admin.confirmPassword')}>
        <InputGroup
          tabIndex={2}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          type="password"
          name="confirmPassword"
          id="confirmPassword"
        />
      </FormGroup>
      <PasswordStrengthMeter pwdCandidate={newPassword} />

      <Button
        tabIndex={3}
        type="submit"
        text={lang.tr('admin.change')}
        id="btn-change"
        disabled={!newPassword || !confirmPassword}
        intent={Intent.PRIMARY}
      />
    </form>
  )
}
