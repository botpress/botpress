import { Callout } from '@blueprintjs/core'
import { AxiosRequestConfig } from 'axios'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import ms from 'ms'
import React, { useEffect, useState } from 'react'

import api from '~/app/api'
import PageContainer from '~/app/common/PageContainer'
import LangServer from './LangServer'
import LanguageManagement from './LanguageManagement'
import style from './style.scss'
import { LangServerInfo, LanguageSource } from './typings'

const AXIOS_CONFIG: AxiosRequestConfig = {
  validateStatus: (s: number) => (s >= 200 && s < 300) || s === 404
}

const fetchLangSource = async (): Promise<LanguageSource | undefined> => {
  const { data, status, ...rest } = await api.getSecured().get('/admin/management/languages/sources', AXIOS_CONFIG)

  if (status === 404) {
    return
  }

  const { languageSources } = data as { languageSources: LanguageSource[] }
  const langSource = languageSources[0]
  return langSource
}

const fetchLangServerInfo = async (): Promise<LangServerInfo | undefined> => {
  const { data: langServerInfo, status } = await api.getSecured().get('/admin/management/languages/info', AXIOS_CONFIG)
  if (status === 404) {
    return
  }
  return langServerInfo
}

const fetchNLUEnpoint = async (): Promise<{ nluEndpoint: string; isExternal: boolean }> => {
  const { data: nluInfo } = await api.getSecured().get('/admin/management/languages/nlu-sources')
  return nluInfo
}

const LOADING_TIME = ms('3s')

export default () => {
  const [langSource, setLangSource] = useState<LanguageSource | undefined>()
  const [langServerInfo, setLangServerInfo] = useState<LangServerInfo | undefined>()
  const [loading, setLoading] = useState<boolean>(true)
  const [externalNLU, setExternalNLU] = useState<boolean>(true)

  useEffect(() => {
    const init = async () => {
      const source = await fetchLangSource()
      setLangSource(source)

      const langServerInfo = await fetchLangServerInfo()
      setLangServerInfo(langServerInfo)

      const { isExternal } = await fetchNLUEnpoint()
      setExternalNLU(isExternal)

      if (source && langServerInfo) {
        setLoading(false)
      } else {
        setTimeout(() => {
          setLoading(false)
        }, LOADING_TIME)
      }
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
            {externalNLU && (
              <Callout intent="warning" style={{ marginTop: '10px' }}>
                {lang.tr('admin.languages.externalNLUServer')}
              </Callout>
            )}
            <LanguageManagement languageSource={langSource} readOnly={langServerInfo.readOnly} />
          </div>
          <LangServer source={langSource} langServer={langServerInfo} />
        </div>
      ) : loading ? (
        <div>{lang.tr('admin.languages.loading')}</div>
      ) : (
        <div>{lang.tr('admin.languages.notManageable')}</div>
      )}
    </PageContainer>
  )
}
