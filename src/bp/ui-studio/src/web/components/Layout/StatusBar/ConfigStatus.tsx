import { Button } from '@blueprintjs/core'
import axios from 'axios'
import { lang, ToolTip } from 'botpress/shared'
import { confirmDialog } from 'botpress/shared'
import React, { useEffect, useState } from 'react'
import { toastFailure } from '~/components/Shared/Utils'
import EventBus from '~/util/EventBus'

import style from './style.scss'

const adminUrl = `${window['API_PATH']}/admin/server`

const ConfigStatus = () => {
  const [isDifferent, setDifferent] = useState(false)
  const [isRestarting, setRestart] = useState(false)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    fetchHash()

    const configUpdated = event => setDifferent(event.initialHash !== event.newHash)

    EventBus.default.on('config.updated', configUpdated)
    return () => EventBus.default.off('config.updated', configUpdated)
  }, [])

  useEffect(() => {
    if (!isRestarting) {
      return
    }

    const interval = setInterval(async () => {
      try {
        await axios.get('/status', { timeout: 500 })
        window.location.reload()
      } catch (err) {} // silent intended
    }, 1000)
    return () => clearInterval(interval)
  }, [isRestarting])

  const fetchHash = async () => {
    try {
      const { data } = await axios.get(`${adminUrl}/configHash`)
      if (data.initialHash && data.currentHash && data.initialHash !== data.currentHash) {
        setDifferent(true)
      }
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const restartServer = async () => {
    try {
      await axios.post(`${adminUrl}/rebootServer`)
      setRestart(true)
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const onRestartClick = async () => {
    const conf = await confirmDialog(lang.tr('statusBar.configChangedDialog'), {
      acceptLabel: lang.tr('statusBar.reboot')
    })
    if (conf) {
      await restartServer()
    }
  }

  if (isRestarting) {
    return (
      <div className={style.item}>
        <span className={style.message}>{lang.tr('statusBar.rebooting')}</span>
      </div>
    )
  } else if (isDifferent) {
    return (
      <div className={style.item}>
        <ToolTip content={lang.tr('statusBar.applyConfigsTooltip')}>
          <Button minimal className={style.button} onClick={onRestartClick} text={lang.tr('statusBar.applyConfigs')} />
        </ToolTip>
      </div>
    )
  } else {
    return null
  }
}

export default ConfigStatus
