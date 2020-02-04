import { Callout, Position, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { connect } from 'react-redux'
import api from '~/api'
import { toastInfo } from '~/utils/toaster'
import PageContainer from '~/App/PageContainer'
import { pullToken } from '~/Auth'

import DownloadArchive from './DownloadArchive'
import UploadArchive from './UploadArchive'

const Versioning: FC<{ profile: any }> = props => {
  const [pullCommand, setPullCommand] = useState('')
  const [pushCommand, setPushCommand] = useState('')
  const [isPushAvailable, setPushAvailable] = useState(false)

  useEffect(() => {
    const bpcli = navigator.appVersion.indexOf('Win') !== -1 ? 'bp.exe' : './bp'
    const { token } = pullToken()
    const host = window.location.origin

    setPullCommand(`${bpcli} pull --url ${host}${window['ROOT_PATH']} --authToken ${token} --targetDir data`)
    setPushCommand(`${bpcli} push --url ${host}${window['ROOT_PATH']} --authToken ${token} --sourceDir data`)

    // tslint:disable-next-line: no-floating-promises
    getBpfsStatus()
  }, [])

  const getBpfsStatus = async () => {
    const { data } = await api.getSecured().get('/admin/versioning/bpfs_status')
    setPushAvailable(data.isAvailable)
  }

  const isSuperAdmin = props.profile && props.profile.isSuperAdmin
  const toastCopiedClipboard = () => toastInfo('Copied to clipboard')

  return (
    <PageContainer title="Source Control" superAdmin={true}>
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

      {!isPushAvailable && (
        <Callout title="Push local to this server">
          <p>
            Pushing local changes to a remote server is only possible when using the BPFS Storage "Database". <br />
            <br />
            Check out the{' '}
            <a href="https://botpress.com/docs/next/advanced/versions/" target="_blank">
              <b>documentation</b>
            </a>{' '}
            for more information.
          </p>
        </Callout>
      )}

      {isPushAvailable && (
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
      )}
    </PageContainer>
  )
}

const mapStateToProps = state => ({ profile: state.user.profile })

export default connect(
  mapStateToProps,
  {}
)(Versioning)
