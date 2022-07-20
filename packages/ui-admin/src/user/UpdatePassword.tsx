import { Button, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { lang, toast, auth } from 'botpress/shared'
import { UserProfile } from 'common/typings'
import React, { FC, useState } from 'react'
import api from '~/app/api'
import { PasswordStrengthMeter } from '~/auth/PasswordStrengthMeter/PasswordStrengthMeter'

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
    const client = api.getSecured()

    try {
      await client.post(`/admin/auth/login/${strategyType}/${strategy}`, { email, password, newPassword })

      props.toggle()
      toast.success(lang.tr('admin.passwordUpdatedSuccessfully'))
    } catch (err) {
      const { errorCode, message } = err

      toast.failure(lang.tr('admin.errorUpdatingPassword', { msg: message }))

      // BP_0011 = LockedOutError
      if (errorCode === 'BP_0011') {
        // Let the user see the toast before logging him out
        setTimeout(() => {
          auth.logout(() => client)
        }, 1000)
      }
    }
  }

  const clear = () => {
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <Dialog
      title={lang.tr('admin.changeYourPassword')}
      icon="key"
      isOpen={props.isOpen}
      onClose={props.toggle}
      onClosed={clear}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={lang.tr('admin.currentPassword')}>
            <InputGroup
              id="input-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              tabIndex={1}
              autoFocus={true}
            />
          </FormGroup>

          <FormGroup label={lang.tr('admin.newPassword')}>
            <InputGroup
              id="input-newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              tabIndex={2}
            />
          </FormGroup>

          <FormGroup label={lang.tr('admin.confirmPassword')}>
            <InputGroup
              id="input-confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              tabIndex={3}
            />
          </FormGroup>
          <PasswordStrengthMeter pwdCandidate={newPassword} />
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-submit-update-password"
              type="submit"
              text={lang.tr('save')}
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
