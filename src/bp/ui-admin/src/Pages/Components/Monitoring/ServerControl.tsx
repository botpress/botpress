import { Button, Classes, Dialog, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { toastFailure } from '~/utils/toaster'

import api from '../../../api'

interface Props {
  hostname: string
  isOpen?: boolean
  toggle: () => void
}

const ServerControl: FC<Props> = props => {
  const [isRestarting, setRestarting] = useState(false)

  useEffect(() => {
    setRestarting(false)
  }, [props.isOpen])

  const restartServer = async () => {
    try {
      await api.getSecured().post(`/admin/server/rebootServer?hostname=${props.hostname}`)
      setRestarting(true)
    } catch (err) {
      toastFailure(err.message)
    }
  }

  return (
    <Dialog
      title={lang.tr('admin.monitoring.serverControl')}
      isOpen={props.isOpen}
      onClose={props.toggle}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <div className={Classes.DIALOG_BODY}>
        {!isRestarting ? (
          <div>
            {lang.tr('admin.monitoring.youAreAboutToRestart')} <br /> <strong>{props.hostname}</strong>. <br /> <br />
            {lang.tr('admin.monitoring.areYouSure')}
          </div>
        ) : (
          <div>{lang.tr('admin.monitoring.restartInProgress')}</div>
        )}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          {!isRestarting ? (
            <div>
              <Button id="btn-cancel" text={lang.tr('cancel')} onClick={props.toggle} intent={Intent.NONE} />
              <Button
                id="btn-restart"
                text={lang.tr('admin.monitoring.restartNow')}
                onClick={restartServer}
                intent={Intent.DANGER}
              />
            </div>
          ) : (
            <div>
              {' '}
              <Button id="btn-cancel" text={lang.tr('close')} onClick={props.toggle} intent={Intent.NONE} />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}

export default ServerControl
