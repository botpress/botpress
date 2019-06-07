import Axios from 'axios'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { Alert } from 'reactstrap'

import api from '../../../api'

import { LangServerInfo, LanguageSource } from './typings'
import LanguageManagement from './LanguageManagement'
import LangServer from './LangServer'

// TODO handle case where lang server needs a token

const fetchLangSource = async (setLangSource: Function) => {
  const { data } = (await api.getSecured().get('/admin/languages/sources')) as {
    data: { languageSources: LanguageSource[] }
  }

  const langSource = data.languageSources[0]
  setLangSource(langSource)
  return langSource
}

const fetchLangServerInfo = async (langSource: LanguageSource, setLangServerInfo: Function) => {
  // TODO use langsource token if defined
  const { data: langServerInfo } = (await Axios.get(`${langSource.endpoint}/info`)) as {
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

    init()
  }, [])

  if (langSource && langServerInfo) {
    return (
      <div className='languages-grid'>
        {langServerInfo.readOnly && (
          <div>
            <Alert color='warning'>Languages cannot be edited as Language server is read only</Alert>
          </div>
        )}
        <LanguageManagement languageSource={langSource} readOnly={langServerInfo.readOnly} />
        <LangServer source={langSource} langServer={langServerInfo} />
      </div>
    )
  } else {
    return <div>loading...</div>
  }
}
