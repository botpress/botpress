import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import { LangServerInfo, LanguageSource } from './typings'

interface Props {
  source: LanguageSource
  langServer: LangServerInfo
}

// TODO display something better than this
const LangServer: FC<Props> = props => {
  return (
    <div>
      <p style={{ textAlign: 'center' }}>
        {lang.tr('admin.languages.usingLangServerAt')} <br />
        {props.source.endpoint}
      </p>
      <p style={{ marginTop: 50, width: 240, textAlign: 'center' }}>
        <small>
          {lang.tr('admin.languages.runOwnLanguageServer')}{' '}
          <a href="https://botpress.com/docs/advanced/hosting#hosting-duckling-and-the-language-server" target="_blank">
            {lang.tr('admin.languages.inDocumentation')}
          </a>
        </small>
      </p>
    </div>
  )
}

export default LangServer
