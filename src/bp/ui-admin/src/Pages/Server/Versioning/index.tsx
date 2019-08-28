import { Callout, Position, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { connect } from 'react-redux'
import { toastInfo } from '~/utils/toaster'
import { pullToken } from '~/Auth'

import DownloadArchive from './DownloadArchive'
import UploadArchive from './UploadArchive'

const Versioning: FC<{ profile: any }> = props => {
  const [pullCommand, setPullCommand] = useState('')
  const [pushCommand, setPushCommand] = useState('')

  useEffect(() => {
    const bpcli = navigator.appVersion.indexOf('Win') !== -1 ? 'bp.exe' : './bp'
    const { token } = pullToken()
    const host = window.location.origin

    setPullCommand(`${bpcli} pull --url ${host}${window['ROOT_PATH']} --authToken ${token} --targetDir data`)
    setPushCommand(`${bpcli} push --url ${host}${window['ROOT_PATH']} --authToken ${token} --sourceDir data`)
  }, [])

  const isSuperAdmin = props.profile && props.profile.isSuperAdmin
  const toastCopiedClipboard = () => toastInfo('Copied to clipboard')

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
        <br /> <br />
        {isSuperAdmin && <DownloadArchive />}
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
        <br /> <br />
        {isSuperAdmin && <UploadArchive />}
      </Callout>
    </div>
  )
}

const mapStateToProps = state => ({ profile: state.user.profile })

export default connect(
  mapStateToProps,
  {}
)(Versioning)
