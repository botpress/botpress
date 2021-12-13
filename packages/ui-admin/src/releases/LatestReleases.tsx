import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import snarkdown from 'snarkdown'
import PageContainer from '~/app/common/PageContainer'
import { AppState } from '~/app/rootReducer'

import linux from './media/linux.png'
import mac from './media/mac.png'
import window from './media/windows.png'
import { fetchLatestVersions } from './reducer'
import style from './style.scss'

type Props = ConnectedProps<typeof connector>

const DownloadLinks: FC<{ version: string; dockerUrl: string }> = props => {
  const version = `v${props.version.replace(/\./g, '_')}`

  return (
    <div className={style.downloads}>
      Download binary
      <hr />
      <a href={`https://s3.amazonaws.com/botpress-binaries/botpress-${version}-darwin-x64.zip`} target="_blank">
        <img src={mac} /> Mac
      </a>
      <br />
      <a href={`https://s3.amazonaws.com/botpress-binaries/botpress-${version}-win-x64.zip`} target="_blank">
        <img src={window} /> Windows
      </a>
      <br />
      <a href={`https://s3.amazonaws.com/botpress-binaries/botpress-${version}-linux-x64.zip`} target="_blank">
        <img src={linux} /> Linux
      </a>
      <br />
      <br />
      Docker Image
      <hr />
      <a href={props.dockerUrl || 'https://hub.docker.com/r/botpress/server'} target="_blank">
        <code>botpress/server:{version}</code>
      </a>
    </div>
  )
}

const LastRelease: FC<Props> = props => {
  useEffect(() => {
    props.fetchLatestVersions()
  }, [])

  return (
    <PageContainer title={lang.tr('admin.sideMenu.latestReleases')}>
      <div className={style.releases}>
        {props.latestReleases.map(release => {
          return (
            <div key={release.version}>
              <div className={style.version}>
                {release.version}
                <span>published {release.daysAgo}</span>
              </div>

              <div className={style.container}>
                <div className={style.content} dangerouslySetInnerHTML={{ __html: snarkdown(release.details) }} />
                <DownloadLinks version={release.version} dockerUrl={release.dockerUrl} />
              </div>
            </div>
          )
        })}
      </div>
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => ({ latestReleases: state.version.latestReleases })
const connector = connect(mapStateToProps, { fetchLatestVersions })

export default connector(LastRelease)
