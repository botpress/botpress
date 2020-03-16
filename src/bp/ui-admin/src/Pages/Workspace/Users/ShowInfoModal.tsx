import { Button, Intent, Pre } from '@blueprintjs/core'
import { BaseDialog, DialogBody, DialogFooter } from 'botpress/shared'
import React, { FC } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { toastInfo } from '~/utils/toaster'

interface Props {
  isOpen: boolean
  toggle: () => void
  messageId: 'newAccount' | 'passwordReset'
  email: string
  password: string
}

const ShowInfoModal: FC<Props> = props => {
  const messages = {
    newAccount: `Your botpress account is ready!

  Sign-in here: ${window.location.origin}/admin/login
  Email: ${props.email}
  Password: ${props.password}`,

    passwordReset: `Your password has been reset.

    Email: ${props.email}
    Password: ${props.password}`
  }

  if (!messages[props.messageId]) {
    return null
  }

  return (
    <BaseDialog
      title={props.messageId === 'newAccount' ? 'Account Created' : 'Password Reset'}
      icon="info-sign"
      isOpen={props.isOpen}
      onClose={props.toggle}
    >
      <DialogBody>
        <Pre>{messages[props.messageId]}</Pre>
      </DialogBody>
      <DialogFooter>
        <CopyToClipboard text={messages[props.messageId]} onCopy={() => toastInfo('Copied to clipboard')}>
          <Button text="Copy message to clipboard" />
        </CopyToClipboard>

        <CopyToClipboard text={props.password} onCopy={() => toastInfo('Copied to clipboard')}>
          <Button text="Copy password to clipboard" intent={Intent.PRIMARY} />
        </CopyToClipboard>
      </DialogFooter>
    </BaseDialog>
  )
}

export default ShowInfoModal
