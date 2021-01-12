import { Colors, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import { ContentSection, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'

import { Intents } from '../components/Intents'
import style from '../style.scss'

import { Entities } from './Entities'
import { Language } from './Language'
import { Slots } from './Slots'

const NLU: FC<{ nluData: sdk.IO.EventUnderstanding; session: any }> = ({ nluData, session }) => {
  if (!nluData) {
    return null
  }

  return (
    <Fragment>
      <ContentSection title={lang.tr('bottomPanel.debugger.nlu.languageUnderstanding')} className={style.section}>
        <div>
          {nluData.ambiguous && (
            <Tooltip
              position={Position.TOP}
              content={
                <span>
                  {lang.tr('bottomPanel.debugger.nlu.intentsVeryClose')}
                  <br />
                  {lang.tr('bottomPanel.debugger.nlu.youCanAccountForIt')}
                  <strong style={{ color: Colors.ORANGE5 }}>event.nlu.ambiguous</strong>
                </span>
              }
            >
              <span style={{ color: Colors.ORANGE3 }}>
                <Icon icon="warning-sign" color={Colors.ORANGE3} />
                &nbsp;{lang.tr('bottomPanel.debugger.nlu.ambiguous')}
              </span>
            </Tooltip>
          )}
        </div>
        <Language detectedLanguage={nluData.detectedLanguage} usedLanguage={nluData.language} />
      </ContentSection>

      <Intents intents={nluData.intents} intent={nluData.intent} />

      {!!nluData.entities.length && (
        <ContentSection title={lang.tr('entities')} className={style.section}>
          <Entities entities={nluData.entities} />
        </ContentSection>
      )}

      {(!_.isEmpty(session.slots) || !_.isEmpty(nluData.slots)) && (
        <ContentSection title={lang.tr('slots')} className={style.section}>
          <Slots sessionSlots={session.slots} slots={nluData.slots} />
        </ContentSection>
      )}
    </Fragment>
  )
}

export default NLU
