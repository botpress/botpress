import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'

interface Props {
  onLogin: (email, password) => void
}

export const LoginForm: FC<Props> = props => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = e => {
    e.preventDefault()
    props.onLogin(email, password)
  }

  return (
    <form onSubmit={onSubmit}>
      <FormGroup label={lang.tr('email')}>
        <InputGroup
          tabIndex={1}
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="text"
          id="email-login"
          autoFocus={true}
        />
      </FormGroup>

      <FormGroup label={lang.tr('admin.password')}>
        <InputGroup
          tabIndex={2}
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          id="password-login"
        />
      </FormGroup>

      <Button
        tabIndex={3}
        type="submit"
        id="btn-signin"
        text={lang.tr('admin.signIn')}
        disabled={!email || !password}
        intent={Intent.PRIMARY}
      />
    </form>
  )
}
