import { Button, Intent, Pre } from '@blueprintjs/core'
import { BaseDialog, DialogBody, DialogFooter, lang } from 'botpress/shared'
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
    newAccount: `${lang.tr('admin.workspace.users.collaborators.accountReady')}

  ${lang.tr('admin.workspace.users.collaborators.signInHere', { link: `${window.location.origin}/admin/login` })}
  ${lang.tr('admin.workspace.users.collaborators.showEmail', { email: props.email })}
  ${lang.tr('admin.workspace.users.collaborators.showPassword', { password: props.password })}`,

    passwordReset: `${lang.tr('admin.workspace.users.collaborators.passwordBeenReset')}

    ${lang.tr('admin.workspace.users.collaborators.showEmail', { email: props.email })}
    ${lang.tr('admin.workspace.users.collaborators.showPassword', { password: props.password })}`
  }

  if (!messages[props.messageId]) {
    return null
  }

  return (
    <BaseDialog
      title={
        props.messageId === 'newAccount'
          ? lang.tr('admin.workspace.users.collaborators.accountReady')
          : lang.tr('admin.workspace.users.collaborators.passwordReset')
      }
      icon="info-sign"
      isOpen={props.isOpen}
      onClose={props.toggle}
    >
      <DialogBody>
        <Pre>{messages[props.messageId]}</Pre>
      </DialogBody>
      <DialogFooter>
        <CopyToClipboard
          text={messages[props.messageId]}
          onCopy={() => toastInfo(lang.tr('admin.workspace.users.collaborators.copiedToClipboard'))}
        >
          <Button text={lang.tr('admin.workspace.users.collaborators.copyMessageToClipboard')} />
        </CopyToClipboard>

        <CopyToClipboard
          text={props.password}
          onCopy={() => toastInfo(lang.tr('admin.workspace.users.collaborators.copiedToClipboard'))}
        >
          <Button
            text={lang.tr('admin.workspace.users.collaborators.copyPasswordToClipboard')}
            intent={Intent.PRIMARY}
          />
        </CopyToClipboard>
      </DialogFooter>
    </BaseDialog>
  )
}

export default ShowInfoModal
