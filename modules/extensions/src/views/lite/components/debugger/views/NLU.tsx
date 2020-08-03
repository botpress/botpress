import { Button, Colors, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { Fragment, SFC, useEffect, useState } from 'react'

import { Collapsible } from '../components/Collapsible'
import { Intents } from '../components/Intents'
import Predictions from '../components/Predictions'
import style from '../style.scss'

import { Entities } from './Entities'
import { Inspector } from './Inspector'
import { Language } from './Language'
import { Slots } from './Slots'

interface Props {
  nluData: sdk.IO.EventUnderstanding
  isNDU: boolean
  session: any
  expandedSections: string[]
  updateExpandedSections: (section: string, expanded: boolean) => void
  jsonSections: string[]
  updateJsonSections: (section: string, isJson: boolean) => void
}

const NLU: SFC<Props> = ({
  nluData,
  isNDU,
  expandedSections,
  updateExpandedSections,
  jsonSections,
  updateJsonSections,
  session
}) => {
  const [viewJSON, setViewJSON] = useState(jsonSections.includes('nlu'))

  useEffect(() => {
    setViewJSON(jsonSections.includes('nlu'))
  }, [jsonSections])

  if (!nluData) {
    return null
  }

  const toggleView = () => {
    const newValue = !viewJSON
    updateJsonSections('nlu', newValue)
    setViewJSON(newValue)
  }

  const renderContent = () => {
    if (viewJSON) {
      return <Inspector data={nluData} />
    }

    return (
      <Fragment>
        {!isNDU && nluData.ambiguous && (
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
        {!isNDU && <Intents intents={nluData.intents} intent={nluData.intent} />}
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
      <Collapsible
        opened={expandedSections.includes('nlu')}
        updateExpandedSections={expanded => updateExpandedSections('nlu', expanded)}
        name="Language Understanding"
      >
        {renderContent()}
        <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
          {viewJSON ? 'View as Summary' : 'View as JSON'}
        </Button>
      </Collapsible>
    </Fragment>
  )
}

export default NLU
