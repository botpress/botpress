import axios from 'axios'
import _ from 'lodash'
import moment from 'moment'
import React, { FC, useEffect, useState } from 'react'
import snarkdown from 'snarkdown'
import PageContainer from '~/App/PageContainer'

import linux from '../../media/linux.png'
import mac from '../../media/mac.png'
import window from '../../media/windows.png'

interface GithubRelease {
  version: string
  details: string
  githubUrl: string
  releaseDate: Date
  daysAgo: string
}

const DownloadLinks: FC<{ version: string }> = props => {
  const version = props.version.replace(/\./g, '_')

  return (
    <div className="downloads">
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
      <code>botpress/server:{version}</code>
    </div>
  )
}

const LastRelease = () => {
  const [releases, setReleases] = useState<GithubRelease[]>()

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    axios.get('https://api.github.com/repos/botpress/botpress/releases').then(({ data }) => {
      const releases = _.take(data, 5).map((x: any) => ({
        version: x.name,
        details: x.body,
        githubUrl: x.html_url,
        releaseDate: x.created_at,
        daysAgo: moment(x.created_at).fromNow()
      }))

      setReleases(releases)
    })
  }, [])

  return (
    <PageContainer title="Latest Releases">
      <div className="releases">
        {releases &&
          releases.map(release => {
            return (
              <div>
                <div className="version">
                  {release.version}
                  <span>published {release.daysAgo}</span>
                </div>

                <div className="container">
                  <div className="content" dangerouslySetInnerHTML={{ __html: snarkdown(release.details) }} />
                  <DownloadLinks version={release.version} />
                </div>
              </div>
            )
          })}
      </div>
    </PageContainer>
  )
}

export default LastRelease
