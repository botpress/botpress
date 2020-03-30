import { Colors, H4, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { SFC } from 'react'

import { Collapsible } from '../components/Collapsible'
import { Intents } from '../components/Intents'
import style from '../style.scss'

import { Entities } from './Entities'
import { Language } from './Language'
import { Slots } from './Slots'

const NLU: SFC<{ nluData: sdk.IO.EventUnderstanding; session: any }> = ({ nluData, session }) => {
  if (!nluData) {
    return null
  }

  return (
    <div className={style.block}>
      <div className={style.title}>
        <H4>Language Understanding</H4>
        {nluData.ambiguous && (
          <Tooltip
            position={Position.TOP}
            content={
              <span>
                Predicted intents are very close.
                <br />
                You can account for it checking the{' '}
                <strong style={{ color: Colors.ORANGE5 }}>event.nlu.ambiguous</strong> variable.
              </span>
            }
          >
            <span style={{ color: Colors.ORANGE3 }}>
              <Icon icon="warning-sign" color={Colors.ORANGE3} />
              &nbsp;Ambiguous
            </span>
          </Tooltip>
        )}
      </div>
      <Language detectedLanguage={nluData.detectedLanguage} usedLanguage={nluData.language} />
      <Intents intents={nluData.intents} intent={nluData.intent} />

      <Collapsible name="Entities" hidden={!nluData.entities.length}>
        <Entities entities={nluData.entities} />
      </Collapsible>

      <Collapsible name="Slots" hidden={_.isEmpty(session.slots) && _.isEmpty(nluData.slots)}>
        <Slots sessionSlots={session.slots} slots={nluData.slots} />
      </Collapsible>
    </div>
  )
}

export default NLU
