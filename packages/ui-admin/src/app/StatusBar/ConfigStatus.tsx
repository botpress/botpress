import { Button, Colors, Icon, Intent } from '@blueprintjs/core'
import { toast, Dialog } from 'botpress/shared'
import React, { Fragment, useEffect, useState } from 'react'

import api from '../api'
import EventBus from '../EventBus'
import ActionItem from './ActionItem'

interface Config {
  initialHash: string
  newHash: string
}

const ConfigStatus = () => {
  const [isDifferent, setDifferent] = useState(false)
  const [isRestarting, setRestart] = useState(false)
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchHash()

    const configUpdated = (event: Config) => setDifferent(event.initialHash !== event.newHash)

    EventBus.default.on('config.updated', configUpdated)
    return () => {
      EventBus.default.off('config.updated', configUpdated)
    }
  }, [])

  useEffect(() => {
    if (!isRestarting) {
      return
    }

    const interval = setInterval(async () => {
      try {
        await api.getAnonymous({ toastErrors: false }).get('/status', { timeout: 500, baseURL: '/' })
        window.location.reload()
      } catch (err) {} // silent intended
    }, 1000)
    return () => clearInterval(interval)
  }, [isRestarting])

  const fetchHash = async () => {
    try {
      const { data } = await api.getSecured().get('/admin/management/configHash')
      if (data.initialHash && data.currentHash && data.initialHash !== data.currentHash) {
        setDifferent(true)
      }
    } catch (err) {
      toast.failure(err.message)
    }
  }

  const restartServer = async () => {
    try {
      await api.getSecured().post('/admin/management/rebootServer')
      setRestart(true)
    } catch (err) {
      toast.failure(err.message)
    }
  }

  return (
    <Fragment>
      <ActionItem
        id="statusbar_configstatus"
        title="Config Status"
        description="Pending changes"
        onClick={() => setOpen(true)}
      >
        {isDifferent && <Icon icon="cog" style={{ color: Colors.RED5 }} />}
      </ActionItem>

      <Dialog.Wrapper
        title="Configuration Outdated"
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        transitionDuration={0}
        canOutsideClickClose={false}
      >
        <Dialog.Body>
          {!isRestarting ? (
            <div>
              Changes were made to the main Botpress configuration file. <br />
              It is recommended to restart the server so they can take effect.
            </div>
          ) : (
            <div>Server restart in progress, please wait...</div>
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            id="btn-restart"
            text={isRestarting ? 'Please wait...' : 'Restart server now'}
            disabled={isRestarting}
            onClick={restartServer}
            intent={Intent.PRIMARY}
          />
        </Dialog.Footer>
      </Dialog.Wrapper>
    </Fragment>
  )
}

export default ConfigStatus
