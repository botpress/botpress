import { Button, Colors, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { Fragment, SFC, useEffect, useState } from 'react'

import Collapsible from '../../../../../../../../src/bp/ui-shared-lite/Collapsible'
import lang from '../../../../lang'
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
  context: sdk.IO.DialogContext
  isExpanded: (key: string) => boolean
  toggleExpand: (section: string, expanded: boolean) => void
}

const NLU_JSON = 'json::nlu'
const NLU_PANEL = 'panel::nlu'

const NLU: SFC<Props> = ({ nluData, isNDU, isExpanded, toggleExpand, context }) => {
  const [viewJSON, setViewJSON] = useState(isExpanded(NLU_JSON))

  useEffect(() => {
    setViewJSON(isExpanded(NLU_JSON))
  }, [isExpanded(NLU_JSON)])

  if (!nluData) {
    return null
  }

  const toggleView = () => {
    const newValue = !viewJSON
    toggleExpand(NLU_JSON, newValue)
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
                {lang.tr('module.extensions.nlu.intentsVeryClose')}
                <br />
                {lang.tr('module.extensions.nlu.youCanAccountForIt')}
                <strong style={{ color: Colors.ORANGE5 }}>event.nlu.ambiguous</strong>
              </span>
            }
          >
            <span style={{ color: Colors.ORANGE3 }}>
              <Icon icon="warning-sign" color={Colors.ORANGE3} />
              &nbsp;{lang.tr('module.extensions.nlu.ambiguous')}
            </span>
          </Tooltip>
        )}
        <Language detectedLanguage={nluData.detectedLanguage} usedLanguage={nluData.language} />
        <Predictions predictions={nluData.predictions} activePrompt={context?.activePrompt} />
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
    <Collapsible
      opened={isExpanded(NLU_PANEL)}
      toggleExpand={expanded => toggleExpand(NLU_PANEL, expanded)}
      name={lang.tr('module.extensions.nlu.languageUnderstanding')}
    >
      {renderContent()}
      <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
        {viewJSON ? lang.tr('module.extensions.viewAsSummary') : lang.tr('module.extensions.viewAsJson')}
      </Button>
    </Collapsible>
  )
}

export default NLU
