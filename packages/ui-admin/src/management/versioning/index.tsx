import { Button, Callout, Position, Tooltip } from '@blueprintjs/core'
import { lang, auth, toast } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { connect, ConnectedProps } from 'react-redux'

import api from '~/app/api'
import PageContainer from '~/app/common/PageContainer'
import { AppState } from '~/app/rootReducer'
import DownloadArchive from './DownloadArchive'
import UploadArchive from './UploadArchive'

const MIN_UUID_LENGTH = 50

const DisplayCommand = ({ command }) => {
  const [visible, setVisible] = useState(false)
  const text = visible ? command : `${command.split('authToken')[0]}authToken `
  const toastCopiedClipboard = () => toast.info('Copied to clipboard')

  return (
    <div>
      <code>{text}</code>
      <br />
      <Button
        small
        onClick={() => setVisible(!visible)}
        text={lang.tr(visible ? 'admin.hideToken' : 'admin.showToken')}
      />
      &nbsp;
      <CopyToClipboard text={command} onCopy={toastCopiedClipboard}>
        <Button small text="Copy to clipboard" icon="clipboard" />
      </CopyToClipboard>
    </div>
  )
}

type Props = ConnectedProps<typeof connector>

const Versioning: FC<Props> = props => {
  const [pullCommand, setPullCommand] = useState('')
  const [pushCommand, setPushCommand] = useState('')
  const [isPushAvailable, setPushAvailable] = useState(false)
  const [userToken, setUserToken] = useState('')

  useEffect(() => {
    const token = auth.getToken(true) as string
    if (token.length > MIN_UUID_LENGTH) {
      setUserToken(token)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      getCookieToken()
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getBpfsStatus()
  }, [])

  useEffect(() => {
    const bpcli = navigator.appVersion.indexOf('Win') !== -1 ? 'bp.exe' : './bp'
    const host = window.location.origin

    setPullCommand(`${bpcli} pull --url ${host}${window['ROOT_PATH']} --authToken ${userToken} --targetDir data`)
    setPushCommand(`${bpcli} push --url ${host}${window['ROOT_PATH']} --authToken ${userToken} --sourceDir data`)
  }, [userToken])

  const getBpfsStatus = async () => {
    const { data } = await api.getSecured().get('/admin/management/versioning/bpfs_status')
    setPushAvailable(data.isAvailable)
  }

  const getCookieToken = async () => {
    const { data } = await api.getSecured().get('/admin/auth/getToken')
    setUserToken(data)
  }

  const isSuperAdmin = props.profile && props.profile.isSuperAdmin

  return (
    <PageContainer title={lang.tr('admin.versioning.sourceControl')} superAdmin={true}>
      <Callout title={lang.tr('admin.versioning.pullToFileSystem')}>
        <p>{lang.tr('admin.versioning.useThisCommand')}</p>
        <DisplayCommand command={pullCommand}></DisplayCommand>
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
            <a
              href="https://botpress.com/docs/going-to-production/development-lifecycle/versioning#push"
              target="_blank"
            >
              <b>{lang.tr('admin.versioning.documentation')}</b>
            </a>{' '}
            {lang.tr('admin.versioning.forMorInfo')}
          </p>
        </Callout>
      )}

      {isPushAvailable && (
        <Callout title={lang.tr('admin.versioning.pushLocal')}>
          <p>{lang.tr('admin.versioning.youCanPushWithThisCommand')}</p>
          <DisplayCommand command={pushCommand}></DisplayCommand>
          <br /> <br />
          {isSuperAdmin && <UploadArchive />}
        </Callout>
      )}
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => ({ profile: state.user.profile })

const connector = connect(mapStateToProps, {})
export default connector(Versioning)
