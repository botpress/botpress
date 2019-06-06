import Axios from 'axios'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { Alert } from 'reactstrap'

import api from '../../../api'

import { LangServerInfo, LanguageSource } from './typings'
import Language from './Language'
import LangServer from './LangServer'

// TODO change flag prop for for svg
// TODO handle api/loading errors
// TODO handle case where lang server needs a token

interface Languages {
  available: any[]
  downloading: any[]
  installed: any[]
}

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

const fetchLanguages = async (langSource: LanguageSource, setLanguages: Function) => {
  // TODO use langsource token if defined
  const { data } = (await Axios.get(`${langSource.endpoint}/languages`)) as { data: Languages }
  setLanguages(data)
}

export default () => {
  const [langSource, setLangSource] = useState<LanguageSource | undefined>()
  const [langServerInfo, setLangServerInfo] = useState<LangServerInfo | undefined>()
  const [languages, setLanguages] = useState<Languages | undefined>()

  useEffect(() => {
    const init = async () => {
      const source = await fetchLangSource(setLangSource)
      await fetchLangServerInfo(source, setLangServerInfo)
      await fetchLanguages(source, setLanguages)
    }

    init()
  }, [])

  useEffect(() => {
    const id = setInterval(fetchLanguages.bind({}, langSource!, setLanguages), 2000)
    return () => clearInterval(id)
  })

  if (langSource && langServerInfo) {
    return (
      <div className='languages-grid'>
        <div>
          {langServerInfo.readOnly && (
            <Alert color='warning'>Langauges cannot be edited as Language server is read only</Alert>
          )}
          {/* TODO we might want to extract languages in a component ? */}
          {languages && languages.available.length > 0 && !langServerInfo.readOnly && (
            <div className='languages-list'>
              {/* TODO add a select when we have too many languages */}
              <h4>Add Languages</h4>
              {(languages.available || [])
                .filter(lang => !languages.installed.find((l: any) => l.lang == lang.code))
                .map(lang => (
                  <Language
                    key={lang.code}
                    language={lang}
                    installed={false}
                    loaded={false}
                    allowActions={!langServerInfo.readOnly}
                    languageSource={langSource}
                    downloadProgress={languages.downloading.find(l => l.lang == lang.code)}
                  />
                ))}
            </div>
          )}
          <div className='languages-list'>
            <h4>Installed Languages</h4>
            {languages &&
              languages.installed
                .map(x => ({
                  ...x,
                  ...languages.available.find(l => l.code === x.lang)
                }))
                .map(lang => (
                  <Language
                    key={lang.code}
                    language={lang}
                    installed={true}
                    loaded={lang.loaded}
                    allowActions={!langServerInfo.readOnly}
                    languageSource={langSource}
                  />
                ))}
          </div>
        </div>
        <LangServer source={langSource} langServer={langServerInfo} />
      </div>
    )
  } else {
    return <div>loading...</div>
  }
}
