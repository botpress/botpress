import { Button, Intent, Pre } from '@blueprintjs/core'
import { Dialog, lang, toast } from 'botpress/shared'
import React, { FC } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

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
    <Dialog.Wrapper
      title={
        props.messageId === 'newAccount'
          ? lang.tr('admin.workspace.users.collaborators.accountReady')
          : lang.tr('admin.workspace.users.collaborators.passwordReset')
      }
      icon="info-sign"
      isOpen={props.isOpen}
      onClose={props.toggle}
    >
      <Dialog.Body>
        <Pre>{messages[props.messageId]}</Pre>
      </Dialog.Body>
      <Dialog.Footer>
        <CopyToClipboard
          text={messages[props.messageId]}
          onCopy={() => toast.info(lang.tr('admin.workspace.users.collaborators.copiedToClipboard'))}
        >
          <Button text={lang.tr('admin.workspace.users.collaborators.copyMessageToClipboard')} />
        </CopyToClipboard>

        <CopyToClipboard
          text={props.password}
          onCopy={() => toast.info(lang.tr('admin.workspace.users.collaborators.copiedToClipboard'))}
        >
          <Button
            text={lang.tr('admin.workspace.users.collaborators.copyPasswordToClipboard')}
            intent={Intent.PRIMARY}
          />
        </CopyToClipboard>
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

export default ShowInfoModal
