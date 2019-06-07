import Axios from 'axios'
import React, { FC, useEffect, useState } from 'react'

import { LanguageSource } from './typings'
import Language from './Language'

// TODO better typings
interface LanguageData {
  available: any[]
  downloading: any[]
  installed: any[]
}

const fetchLanguages = async (langSource: LanguageSource, setLanguages: Function) => {
  // TODO use langsource token if defined
  const { data } = (await Axios.get(`${langSource.endpoint}/languages`)) as { data: LanguageData }
  setLanguages(data)
}

interface Props {
  languageSource: LanguageSource
  readOnly: boolean
}

const LanguageManagement: FC<Props> = props => {
  const [languages, setLanguages] = useState<LanguageData | undefined>()
  useEffect(() => {
    const init = async () => {
      await fetchLanguages(props.languageSource, setLanguages)
    }

    init()
  }, [])

  useEffect(() => {
    const id = setInterval(fetchLanguages.bind({}, props.languageSource!, setLanguages), 2000)
    return () => clearInterval(id)
  })

  if (!languages) {
    return <div>loading</div>
  }

  const downloadables = (languages.available || []).filter(
    lang => !languages.installed.find((l: any) => l.lang == lang.code)
  )

  const installed = languages.installed.map(x => ({
    ...x,
    ...languages.available.find(l => l.code === x.lang)
  }))

  return (
    <div>
      {/* TODO we might want to extract languages in a component ? */}
      {languages && languages.available.length > 0 && !props.readOnly && (
        <div className='languages-list'>
          {/* TODO add a select when we have too many languages */}
          <h4>Add Languages</h4>
          {downloadables.map(lang => (
            <Language
              key={lang.code}
              language={lang}
              installed={false}
              loaded={false}
              allowActions={!props.readOnly}
              languageSource={props.languageSource}
              downloadProgress={languages.downloading.find(l => l.lang == lang.code)}
            />
          ))}
        </div>
      )}
      <div className='languages-list'>
        <h4>Installed Languages</h4>
        {installed.length === 0 && <div>lol</div>}
        {installed.map(lang => (
          <Language
            key={lang.code}
            language={lang}
            installed={true}
            loaded={lang.loaded}
            allowActions={!props.readOnly}
            languageSource={props.languageSource}
          />
        ))}
      </div>
    </div>
  )
}

export default LanguageManagement
