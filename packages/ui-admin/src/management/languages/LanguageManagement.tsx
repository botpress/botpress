import { Spinner } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import api from '~/app/api'

import Language from './Language'
import style from './style.scss'
import { LanguageSource } from './typings'

// TODO better typings
interface LanguageData {
  available: any[]
  downloading: any[]
  installed: any[]
}

const fetchLanguages = async (setLanguages: Function) => {
  const { data } = (await api.getSecured().get('/admin/management/languages')) as { data: LanguageData }
  setLanguages(data)
}

interface Props {
  languageSource: LanguageSource
  readOnly: boolean
}

const LanguageManagement: FC<Props> = props => {
  const [languages, setLanguages] = useState<LanguageData | undefined>()
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchLanguages(setLanguages)
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

  const installed = _.sortBy(languages.installed, 'name').map(x => ({
    ...x,
    ...languages.available.find(l => l.code === x.lang)
  }))

  return (
    <React.Fragment>
      {languages && languages.available.length > 0 && !props.readOnly && !!downloadables.length && (
        <div className={style.languages_list}>
          {/* TODO add a select when we have too many languages */}
          <h4>{lang.tr('admin.languages.addLanguages')}</h4>
          {downloadables.map(lang => (
            <Language
              key={lang.code}
              language={lang}
              allowActions={!props.readOnly}
              languageSource={props.languageSource}
              downloadProgress={languages.downloading.find(l => l.lang === lang.code)}
            />
          ))}
        </div>
      )}
      <div className={style.languages_list}>
        <h4>{lang.tr('admin.languages.installedLanguages')}</h4>
        {installed.length === 0 && <p>{lang.tr('admin.languages.noLanguagesYet')}</p>}
        {installed.map(lang => (
          <Language
            key={lang.code}
            language={lang}
            installed
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
