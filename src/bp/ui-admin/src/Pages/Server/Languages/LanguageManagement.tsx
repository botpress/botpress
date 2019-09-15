import { Spinner } from '@blueprintjs/core'
import React, { FC, useEffect, useState } from 'react'

import api from '../../../api'

import { LanguageSource } from './typings'
import Language from './Language'

// TODO better typings
interface LanguageData {
  available: any[]
  downloading: any[]
  installed: any[]
}

const fetchLanguages = async (setLanguages: Function) => {
  const { data } = (await api.getSecured().get('/admin/languages')) as { data: LanguageData }
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
      await fetchLanguages(setLanguages)
    }

    init()
  }, [])

  // TODO extract this as a custom hook
  useEffect(() => {
    const id = setInterval(fetchLanguages.bind({}, setLanguages), 2000)
    return () => clearInterval(id)
  })

  if (!languages) {
    return <Spinner size={30} />
  }

  const downloadables = (languages.available || []).filter(
    lang => !languages.installed.find((l: any) => l.lang === lang.code)
  )

  const installed = languages.installed.map(x => ({
    ...x,
    ...languages.available.find(l => l.code === x.lang)
  }))

  return (
    <React.Fragment>
      {languages && languages.available.length > 0 && !props.readOnly && !!downloadables.length && (
        <div className="languages-list">
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
      <div className="languages-list">
        <h4>Installed Languages</h4>
        {installed.length === 0 && <p>No languages yet</p>}
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
    </React.Fragment>
  )
}

export default LanguageManagement
