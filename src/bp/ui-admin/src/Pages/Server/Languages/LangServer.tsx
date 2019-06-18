import React, { FC } from 'react'

import { LangServerInfo, LanguageSource } from './typings'

interface Props {
  source: LanguageSource
  langServer: LangServerInfo
}

// TODO display somthing better than this
const LangServer: FC<Props> = props => {
  return <div>Using lang server at {props.source.endpoint}</div>
}

export default LangServer
