import { H4 } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { SFC } from 'react'

import style from '../style.scss'

import { Entities } from './Entities'
import { Intents } from './Intents'
import { Slots } from './Slots'

const NLU: SFC<{ nluData: sdk.IO.EventUnderstanding }> = ({ nluData }) => {
  return (
    <div className={style.block}>
      <H4>Understanding</H4>
      <Intents intents={nluData.intents} intent={nluData.intent} />
      {nluData.entities.length > 0 && <Entities entities={nluData.entities} />}
      {nluData.slots && !_.isEmpty(nluData.slots) && <Slots slots={nluData.slots} />}
    </div>
  )
}

export default NLU
