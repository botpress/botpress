import { Button, Classes, Dialog, Pre } from '@blueprintjs/core'
import React, { FC } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { toastInfo } from '~/utils/toaster'

interface Props {
  isOpen: boolean
  toggle: () => void
  title: string
  message: string
}

const ShowInfoModal: FC<Props> = props => {
  return (
    <Dialog
      title={props.title}
      icon="info-sign"
      isOpen={props.isOpen}
      onClose={props.toggle}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <div className={Classes.DIALOG_BODY}>
        <Pre>{props.message}</Pre>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <CopyToClipboard text={props.message} onCopy={() => toastInfo('Copied to clipboard')}>
            <Button text={'Copy to clipboard'} />
          </CopyToClipboard>
        </div>
      </div>
    </Dialog>
  )
}

export default ShowInfoModal
