import React, { FC } from 'react'

import { LangServerInfo, LanguageSource } from './typings'

interface Props {
  source: LanguageSource
  langServer: LangServerInfo
}

// TODO display somthing better than this
const LangServer: FC<Props> = props => {
  return (
    <div>
      <p style={{ textAlign: 'center' }}>
        Using lang server at <br />
        {props.source.endpoint}
      </p>
      <p style={{ marginTop: 50, width: 240, textAlign: 'center' }}>
        <small>
          To run your own language server, follow the instructions{' '}
          <a href="https://botpress.io/docs/advanced/hosting#running-your-own-language-server" target="_blank">
            in the documentation
          </a>
        </small>
      </p>
    </div>
  )
}

export default LangServer
