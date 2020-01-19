import { Button, Classes, Dialog, Intent } from '@blueprintjs/core'
import React, { FC } from 'react'

interface Props {
  title?: string
  description: string
  isOpen: boolean
  accept: () => void
  decline: () => void
  acceptLabel?: string
  declineLabel?: string
}

const ConfirmDialog: FC<Props> = props => {
  return (
    <Dialog
      title={props.title}
      icon="warning-sign"
      isOpen={props.isOpen}
      onClose={props.decline}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <div className={Classes.DIALOG_BODY}>{props.description}</div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            id="btn-decline"
            type="button"
            onClick={props.decline}
            text={props.declineLabel}
            tabIndex={2}
            intent={Intent.NONE}
          />
          <Button
            id="btn-accept"
            type="button"
            onClick={props.accept}
            text={props.acceptLabel}
            tabIndex={3}
            intent={Intent.PRIMARY}
          />
        </div>
      </div>
    </Dialog>
  )
}

ConfirmDialog.defaultProps = {
  title: 'Confirmation Needed',
  acceptLabel: 'Accept',
  declineLabel: 'Decline'
}

export default ConfirmDialog
