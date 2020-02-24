import { Classes, H5, Intent, Position, Toaster } from '@blueprintjs/core'
import axios from 'axios'
import _ from 'lodash'
import React, { useEffect } from 'react'

export default () => {
  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    axios.get(`${window.BOT_API_PATH}/mod/nlu/health`).then(({ data }) => {
      if (data.isEnabled) {
        return
      }
      const unreachable = (data.validProvidersCount || 0) === 0
      const nLangs = _.get(data, 'validLanguages.length', 0)

      let toastContent
      if (nLangs === 0) {
        toastContent = (
          <div>
            <H5 className={Classes.DARK}>No Languages Enabled</H5>
            <p>
              There is no language enabled on your language server, bots wont work properly.&nbsp;
              <a href="/admin/server/languages" target="_blank">
                Manage languages here
              </a>
            </p>
          </div>
        )
      }
      if (unreachable) {
        toastContent = (
          <div>
            <H5 className={Classes.DARK}>Language server is not reachable</H5>
            <p>
              Language server is unreachable, bots wont work properly. Check &nbsp;
              <a href="https://botpress.com/docs/main/nlu#language-server" target="_blank">
                the docs
              </a>
              &nbsp; to learn how to run and manage your own language server.
            </p>
          </div>
        )
      }

      Toaster.create({ position: Position.TOP }).show({
        message: toastContent,
        intent: Intent.DANGER,
        timeout: 0
      })
    })
  }, [])

  return null
}
