import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'
import { PasswordStrengthMeter } from './PasswordStrengthMeter/PasswordStrengthMeter'

interface Props {
  onRegister: (email, password, confirmPassword) => void
}

export const RegisterForm: FC<Props> = props => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const onSubmit = e => {
    e.preventDefault()
    props.onRegister(email, password, confirmPassword)
  }

  const isValid = () => email.length > 4 && password.length > 4 && confirmPassword.length > 4

  return (
    <form onSubmit={onSubmit}>
      <FormGroup label={lang.tr('email')}>
        <InputGroup
          tabIndex={1}
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="text"
          id="email-register"
          autoFocus={true}
        />
      </FormGroup>

      <FormGroup label={lang.tr('admin.password')}>
        <InputGroup
          tabIndex={2}
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          id="password-register"
        />
      </FormGroup>

      <FormGroup label={lang.tr('admin.confirmPassword')}>
        <InputGroup
          tabIndex={3}
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
      </FormGroup>
      <PasswordStrengthMeter pwdCandidate={password} />

      <Button
        tabIndex={4}
        type="submit"
        id="btn-register"
        text={lang.tr('admin.createAccount')}
        disabled={!isValid()}
        intent={Intent.PRIMARY}
      />
    </form>
  )
}
