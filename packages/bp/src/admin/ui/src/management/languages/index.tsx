import { Callout } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import api from '~/app/api'
import PageContainer from '~/app/common/PageContainer'
import LangServer from './LangServer'
import LanguageManagement from './LanguageManagement'
import style from './style.scss'
import { LangServerInfo, LanguageSource } from './typings'

const fetchLangSource = async (setLangSource: Function) => {
  const { data } = (await api.getSecured().get('/admin/management/languages/sources')) as {
    data: { languageSources: LanguageSource[] }
  }

  const langSource = data.languageSources[0]
  setLangSource(langSource)
  return langSource
}

const fetchLangServerInfo = async (langSource: LanguageSource, setLangServerInfo: Function) => {
  const { data: langServerInfo } = (await api.getSecured().get('/admin/management/languages/info')) as {
    data: LangServerInfo
  }

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

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    init()
  }, [])

  return (
    <PageContainer title={lang.tr('admin.languages.languageManagement')} superAdmin>
      {langSource && langServerInfo ? (
        <div className={style.languages_grid}>
          <div>
            {langServerInfo.readOnly && <Callout intent="warning">{lang.tr('admin.languages.cannotBeEdited')}</Callout>}
            <LanguageManagement languageSource={langSource} readOnly={langServerInfo.readOnly} />
          </div>
          <LangServer source={langSource} langServer={langServerInfo} />
        </div>
      ) : (
        <div>{lang.tr('admin.languages.loading')}</div>
      )}
    </PageContainer>
  )
}
