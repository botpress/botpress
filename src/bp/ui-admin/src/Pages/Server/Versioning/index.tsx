import { Callout, Position, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { connect } from 'react-redux'
import api from '~/api'
import { toastInfo } from '~/utils/toaster'
import PageContainer from '~/App/PageContainer'
import { getToken } from '~/Auth'

import DownloadArchive from './DownloadArchive'
import UploadArchive from './UploadArchive'

const Versioning: FC<{ profile: any }> = props => {
  const [pullCommand, setPullCommand] = useState('')
  const [pushCommand, setPushCommand] = useState('')
  const [isPushAvailable, setPushAvailable] = useState(false)

  useEffect(() => {
    const bpcli = navigator.appVersion.indexOf('Win') !== -1 ? 'bp.exe' : './bp'
    const token = getToken()
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
    <PageContainer title={lang.tr('admin.versioning.sourceControl')} superAdmin={true}>
      <Callout title={lang.tr('admin.versioning.pullToFileSystem')}>
        <p>{lang.tr('admin.versioning.useThisCommand')}</p>
        <Tooltip content={lang.tr('admin.versioning.clickToCopy')} position={Position.RIGHT}>
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
        <Callout title={lang.tr('admin.versioning.pushLocal')}>
          <p>
            {lang.tr('admin.versioning.pushLocalNeedsBFFS')}
            <br />
            <br />
            {lang.tr('admin.versioning.checkOutThe')}{' '}
            <a href="https://botpress.com/docs/next/advanced/versions/" target="_blank">
              <b>{lang.tr('admin.versioning.documentation')}</b>
            </a>{' '}
            {lang.tr('admin.versioning.forMorInfo')}
          </p>
        </Callout>
      )}

      {isPushAvailable && (
        <Callout title={lang.tr('admin.versioning.pushLocal')}>
          <p>{lang.tr('admin.versioning.youCanPushWithThisCommand')}</p>
          <Tooltip content={lang.tr('admin.versioning.clickToCopy')} position={Position.RIGHT}>
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

export default connect(mapStateToProps, {})(Versioning)
