import { Callout } from '@blueprintjs/core'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import api from '../../../api'

import { LangServerInfo, LanguageSource } from './typings'
import LanguageManagement from './LanguageManagement'
import LangServer from './LangServer'

const fetchLangSource = async (setLangSource: Function) => {
  const { data } = (await api.getSecured().get('/admin/languages/sources')) as {
    data: { languageSources: LanguageSource[] }
  }

  const langSource = data.languageSources[0]
  setLangSource(langSource)
  return langSource
}

const fetchLangServerInfo = async (langSource: LanguageSource, setLangServerInfo: Function) => {
  const { data: langServerInfo } = (await api.getSecured().get('/admin/languages/info')) as { data: LangServerInfo }

  setLangServerInfo(langServerInfo)
}

export default () => {
  const [langSource, setLangSource] = useState<LanguageSource | undefined>()
  const [langServerInfo, setLangServerInfo] = useState<LangServerInfo | undefined>()

  useEffect(() => {
    const init = async () => {
      const source = await fetchLangSource(setLangSource)
      await fetchLangServerInfo(source, setLangServerInfo)
    }

    init()
  }, [])

  if (langSource && langServerInfo) {
    return (
      <div className="languages-grid">
        <div>
          {langServerInfo.readOnly && (
            <Callout intent="warning">Languages cannot be edited as Language Server is read only</Callout>
          )}
          <LanguageManagement languageSource={langSource} readOnly={langServerInfo.readOnly} />
        </div>
        <LangServer source={langSource} langServer={langServerInfo} />
      </div>
    )
  } else {
    return <div>loading...</div>
  }
}
