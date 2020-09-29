import { Button } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import Collapsible from '../../../../../../../../src/bp/ui-shared-lite/Collapsible'
import ContentSection from '../../../../../../../../src/bp/ui-shared-lite/ContentSection'
import lang from '../../../../lang'
import style from '../style.scss'

import { Inspector } from './Inspector'

interface Props {
  ndu: sdk.NDU.DialogUnderstanding
  isExpanded: (key: string) => boolean
  toggleExpand: (section: string, expanded: boolean) => void
}

const NDU_JSON = 'json::ndu'
const NDU_PANEL = 'panel::ndu'

const NDU: FC<Props> = ({ ndu, isExpanded, toggleExpand }) => {
  const [viewJSON, setViewJSON] = useState(isExpanded(NDU_JSON))

  useEffect(() => {
    setViewJSON(isExpanded(NDU_JSON))
  }, [isExpanded(NDU_JSON)])

  const toggleView = () => {
    const newValue = !viewJSON
    toggleExpand(NDU_JSON, newValue)
    setViewJSON(newValue)
  }

  const renderContent = () => {
    if (viewJSON) {
      return <Inspector data={ndu} />
    }

    return (
      <ContentSection title={lang.tr('module.extensions.ndu.decisionsTaken')}>
        <ul>
          {ndu.actions.map(({ action, data }, index) => {
            switch (action) {
              case 'send':
                return (
                  <li key={index}>
                    {lang.tr('module.extensions.ndu.sendKnowledge', {
                      x: (data as sdk.NDU.SendContent).sourceDetails
                    })}
                  </li>
                )
              case 'startWorkflow':
                return (
                  <li key={index}>
                    {lang.tr('module.extensions.ndu.startWorkflow', {
                      x: (data as sdk.NDU.FlowRedirect).flow
                    })}
                  </li>
                )
              case 'goToNode':
                return (
                  <li key={index}>
                    {lang.tr('module.extensions.ndu.goToNode', {
                      x: (data as sdk.NDU.FlowRedirect).node
                    })}
                  </li>
                )
              case 'redirect':
                return (
                  <li key={index}>
                    {lang.tr('module.extensions.ndu.redirectTo', {
                      x: (data as sdk.NDU.FlowRedirect).flow
                    })}
                  </li>
                )
              case 'continue':
                return <li key={index}>{lang.tr('module.extensions.ndu.continueFlowExecution')}</li>
              case 'prompt.inform':
                return <li key={index}>{lang.tr('module.extensions.ndu.informCurrentPrompt')}</li>
              case 'prompt.cancel':
                return <li key={index}>{lang.tr('module.extensions.ndu.cancelCurrentPrompt')}</li>
            }
          })}
        </ul>
      </ContentSection>
    )
  }

  if (!ndu || !ndu.triggers) {
    return null
  }

  return (
    <Collapsible
      opened={isExpanded(NDU_PANEL)}
      toggleExpand={expanded => toggleExpand(NDU_PANEL, expanded)}
      name={lang.tr('module.extensions.ndu.dialogUnderstanding')}
    >
      {renderContent()}
      <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
        {viewJSON ? lang.tr('module.extensions.viewAsSummary') : lang.tr('module.extensions.viewAsJson')}
      </Button>
    </Collapsible>
  )
}

export default NDU
