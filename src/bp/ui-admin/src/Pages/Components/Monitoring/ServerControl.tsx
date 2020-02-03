import { Button, Classes, Dialog, Intent } from '@blueprintjs/core'
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
      title="Server Control"
      isOpen={props.isOpen}
      onClose={props.toggle}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <div className={Classes.DIALOG_BODY}>
        {!isRestarting ? (
          <div>
            You are about to restart the Botpress server hosted on <br /> <strong>{props.hostname}</strong>. <br />{' '}
            <br />
            Are you sure?
          </div>
        ) : (
          <div>
            Server restart in progress. To know when the server is back up, watch the uptime for that server in the
            Overview. You can close this window safely.
          </div>
        )}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          {!isRestarting ? (
            <div>
              <Button id="btn-cancel" text="Cancel" onClick={props.toggle} intent={Intent.NONE} />
              <Button id="btn-restart" text="Restart server now" onClick={restartServer} intent={Intent.DANGER} />
            </div>
          ) : (
            <div>
              {' '}
              <Button id="btn-cancel" text="Close" onClick={props.toggle} intent={Intent.NONE} />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}

export default ServerControl
