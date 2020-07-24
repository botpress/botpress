import { Button, Colors, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { Fragment, SFC, useState } from 'react'

import { Collapsible } from '../components/Collapsible'
import { Intents } from '../components/Intents'
import Predictions from '../components/Predictions'
import style from '../style.scss'

import { Entities } from './Entities'
import { Inspector } from './Inspector'
import { Language } from './Language'
import { Slots } from './Slots'

const NLU: SFC<{ nluData: sdk.IO.EventUnderstanding; session: any }> = ({ nluData, session }) => {
  const [viewJSON, setViewJSON] = useState(false)

  if (!nluData) {
    return null
  }

  const toggleView = () => {
    setViewJSON(!viewJSON)
  }

  const renderContent = () => {
    if (viewJSON) {
      return <Inspector data={nluData} />
    }

    return (
      <Fragment>
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
        <Language detectedLanguage={nluData.detectedLanguage} usedLanguage={nluData.language} />
        <Predictions predictions={nluData.predictions} />
        <Intents intent={nluData.intent} intents={nluData.intents} />
        {/* TODO re-add Entities and Slots when design is made for them
        <Collapsible name="Entities" hidden={!nluData.entities.length}>
          <Entities entities={nluData.entities} />
        </Collapsible>

        <Collapsible name="Slots" hidden={_.isEmpty(session.slots) && _.isEmpty(nluData.slots)}>
          <Slots sessionSlots={session.slots} slots={nluData.slots} />
        </Collapsible>
      */}
      </Fragment>
    )
  }

  return (
    <Fragment>
      <Collapsible name="Language Understanding" hidden={!nluData.entities.length}>
        {renderContent()}
        <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
          {viewJSON ? 'View as Summary' : 'View as JSON'}
        </Button>
      </Collapsible>
    </Fragment>
  )
}

export default NLU
