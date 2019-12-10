import { Callout, Intent } from '@blueprintjs/core'
import { NLUApi } from 'api'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import style from './style.scss'

interface Props {
  api: NLUApi
}

// NOTE: this is most likely to change
// It simply has been moved here only so the user doesn't lose this
export const LangServerHealth: FC<Props> = props => {
  const [isHealthy, setIsHealthy] = useState(true)
  const [unreachable, setUnreachable] = useState(false)
  const [nLangs, setNLang] = useState(0)

  useEffect(() => {
    props.api.fetchHealth().then(data => {
      setIsHealthy(data.isEnabled)
      setUnreachable((data.validProvidersCount || 0) === 0)
      setNLang(_.get(data, 'validLanguages.length', 0))
    })
  }, [])

  let title
  let content
  if (nLangs === 0) {
    title = 'No languages enabled'
    content = (
      <span>
        There is no language enabled on your language server, bots wont work properly.&nbsp;
        <a href="/admin/server/languages" target="_blank">
          Manage languages here
        </a>
      </span>
    )
  }
  if (unreachable) {
    title = 'Language server is not reachable'
    content = (
      <span>
        Language server is unreachable, bots wont work properly. Check &nbsp;
        <a href="https://botpress.io/docs/main/nlu#language-server" target="_blank">
          the docs
        </a>
        &nbsp; to learn how to run and manage your own language server.
      </span>
    )
  }

  return (
    !isHealthy && (
      <Callout intent={Intent.WARNING} title={title} className={style.langServerAlert}>
        {content}
      </Callout>
    )
  )
}
