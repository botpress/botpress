import { Callout, Intent, Position, Toaster, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'

import { pullToken } from '../../Auth'

const toastCopiedClipboard = () => {
  Toaster.create({
    className: 'recipe-toaster',
    position: Position.TOP_RIGHT
  }).show({ intent: Intent.PRIMARY, message: 'Copied to clipboard', timeout: 1000 })
}

const Versioning = () => {
  const [pullCommand, setPullCommand] = useState('')
  const [pushCommand, setPushCommand] = useState('')

  useEffect(() => {
    const bpcli = navigator.appVersion.indexOf('Win') !== -1 ? 'bp.exe' : './bp'
    const { token } = pullToken()
    const host = window.location.origin

    setPullCommand(`${bpcli} pull --url ${host}${window['ROOT_PATH']} --authToken ${token} --targetDir data`)
    setPushCommand(`${bpcli} push --url ${host}${window['ROOT_PATH']} --authToken ${token} --sourceDir data`)
  }, [])

  return (
    <div>
      <Callout title="Pull remote to file system">
        <p>Use this command to copy the remote data on your local file system.</p>

        <Tooltip content="Click to copy to clipboard" position={Position.RIGHT}>
          <CopyToClipboard text={pullCommand} onCopy={toastCopiedClipboard}>
            <div style={{ cursor: 'pointer', outline: 'none' }}>
              <code>{pullCommand}</code>
            </div>
          </CopyToClipboard>
        </Tooltip>
      </Callout>

      <br />
      <Callout title="Push local to this server">
        <p>
          If you are using the database storage for BPFS, you can also push your local changes to the database using
          this command:
        </p>

        <Tooltip content="Click to copy to clipboard" position={Position.RIGHT}>
          <CopyToClipboard text={pushCommand} onCopy={toastCopiedClipboard}>
            <div style={{ cursor: 'pointer', outline: 'none' }}>
              <code>{pushCommand}</code>
            </div>
          </CopyToClipboard>
        </Tooltip>
      </Callout>
    </div>
  )
}
export default Versioning
